import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import OperationalError

from app.database import Base, engine
from app.models.user import User 
from app.routers import auth

logger = logging.getLogger("uvicorn.error")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """启动时建表。

    连不上数据库只打一条警告、不阻止启动，这样 /docs 还能打开，方便先确认是库没起还是代码问题。
    """
    try:
        Base.metadata.create_all(bind=engine)
    except OperationalError as error:
        logger.warning("数据库连接失败，本次没有建表：%s", error)
    yield


app = FastAPI(title="Vibe Coding 游戏平台", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)


@app.exception_handler(OperationalError)
async def handle_database_down(request: Request, error: OperationalError):
    """数据库连不上时返回 503 和一句人话，别让前端只看到一个 500。"""
    logger.warning("数据库不可用：%s", error)
    return JSONResponse(
        status_code=503,
        content={"detail": "数据库不可用，请先启动 MySQL 并创建 vibecoding-game 库"},
    )


@app.get("/")
def root():
    """健康检查：确认服务活着，顺便告诉人去哪里看接口文档。"""
    return {"message": "Vibe Coding 游戏平台后端已启动，接口文档见 /docs"}
