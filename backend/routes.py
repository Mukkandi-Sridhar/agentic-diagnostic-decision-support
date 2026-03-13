from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse

from backend.config import Settings, get_settings
from backend.schemas import AnalyzeCaseRequest, AnalysisStartResponse, DashboardStats, SettingsResponse, UploadImageResponse
from backend.services.analysis_service import AnalysisService
from backend.services.case_store import CaseStore
from backend.services.file_store import FileStore

router = APIRouter()

_services: dict[str, object] = {}


def get_case_store(settings: Settings = Depends(get_settings)) -> CaseStore:
    store = _services.get("case_store")
    if not store:
        store = CaseStore(settings)
        _services["case_store"] = store
    return store  # type: ignore[return-value]


def get_file_store(settings: Settings = Depends(get_settings)) -> FileStore:
    store = _services.get("file_store")
    if not store:
        store = FileStore(settings)
        _services["file_store"] = store
    return store  # type: ignore[return-value]


def get_analysis_service(
    settings: Settings = Depends(get_settings),
    case_store: CaseStore = Depends(get_case_store),
    file_store: FileStore = Depends(get_file_store),
) -> AnalysisService:
    service = _services.get("analysis_service")
    if not service:
        service = AnalysisService(settings, case_store, file_store)
        _services["analysis_service"] = service
    return service  # type: ignore[return-value]


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.post("/upload-image", response_model=UploadImageResponse)
async def upload_image(
    file: UploadFile = File(...),
    file_store: FileStore = Depends(get_file_store),
) -> UploadImageResponse:
    payload = await file_store.save_upload(file)
    return UploadImageResponse(**payload)


@router.post("/analyze-case", response_model=AnalysisStartResponse)
async def analyze_case(
    request: AnalyzeCaseRequest,
    background_tasks: BackgroundTasks,
    case_store: CaseStore = Depends(get_case_store),
    file_store: FileStore = Depends(get_file_store),
    service: AnalysisService = Depends(get_analysis_service),
) -> AnalysisStartResponse:
    images = []
    for image in request.images:
        file_token = image.file_token
        if not file_token and image.content_base64:
            extension = f".{image.format.lower()}"
            file_token = file_store.save_base64(image.content_base64, image.id, extension=extension)
        images.append({**image.model_dump(), "file_token": file_token})

    case_store.create_case(request.case_id, request.patient_context.model_dump(), images)
    background_tasks.add_task(service.execute_case, request.case_id)
    return AnalysisStartResponse(
        case_id=request.case_id,
        status="queued",
        progress_url=f"/cases/{request.case_id}/progress",
        result_url=f"/cases/{request.case_id}/result",
    )


@router.get("/cases")
def list_cases(case_store: CaseStore = Depends(get_case_store)) -> dict[str, object]:
    return {"cases": case_store.list_cases()}


@router.get("/cases/{case_id}")
def get_case(case_id: str, case_store: CaseStore = Depends(get_case_store)) -> dict[str, object]:
    case = case_store.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


@router.get("/cases/{case_id}/progress")
def get_case_progress(case_id: str, case_store: CaseStore = Depends(get_case_store)) -> dict[str, object]:
    case = case_store.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return {"case_id": case_id, "status": case["status"], "progress": case["progress"]}


@router.get("/cases/{case_id}/result")
def get_case_result(case_id: str, case_store: CaseStore = Depends(get_case_store)) -> dict[str, object]:
    case = case_store.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    if not case.get("result"):
        return {"case_id": case_id, "status": case["status"], "result": None}
    return case["result"]


@router.get("/cases/{case_id}/images/{file_token}")
def get_case_image(case_id: str, file_token: str, file_store: FileStore = Depends(get_file_store)) -> FileResponse:
    resolved = file_store.resolve(file_token)
    if not resolved:
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(Path(resolved))


@router.get("/dashboard/stats", response_model=DashboardStats)
def dashboard_stats(
    case_store: CaseStore = Depends(get_case_store),
    service: AnalysisService = Depends(get_analysis_service),
) -> DashboardStats:
    stats = case_store.stats()
    stats["indexed_documents"] = len(service.orchestrator.retrieval_agent.retriever.vector_store.documents)
    return DashboardStats(**stats)


@router.get("/settings", response_model=SettingsResponse)
def settings_view(settings: Settings = Depends(get_settings)) -> SettingsResponse:
    return SettingsResponse(
        use_remote_models=settings.use_remote_models,
        gemini_configured=bool(settings.gemini_api_key),
        openai_fallback_configured=bool(settings.openai_api_key),
        pubmed_email=settings.pubmed_email,
        vector_store_path=settings.vector_store_path,
        upload_dir=settings.upload_dir,
    )
