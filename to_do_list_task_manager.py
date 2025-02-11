# To-Do List / Task Manager

from fastapi import FastAPI, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import random
from typing import List,Annotated

from sqlalchemy import create_engine, asc
from sqlalchemy.orm import sessionmaker

from sqlalchemy import Column, Integer, String

from sqlalchemy.orm import Session,declarative_base


app=FastAPI()

origins = ['http://localhost:5173']
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

URL_db = 'postgresql://postgres:password@localhost:5432/To-Do List' 

engine = create_engine(URL_db)
sessionLocal = sessionmaker(autocommit=False,autoflush=False,bind=engine)
Base=declarative_base()

class Choice(BaseModel):
    choice:str

class Task(BaseModel):
    task:str

class Tasks(Base):
    __tablename__ = 'Tasks'
    id = Column(Integer,primary_key=True,index=True)
    task = Column(String,index=True)
    status = Column(String,index=True)

Base.metadata.create_all(bind=engine)

def get_db():
    db=sessionLocal()
    try:
        yield db
    finally:
        db.close()

db_dependency=Annotated[Session,Depends(get_db)]

@app.post("/user-choice",status_code=status.HTTP_200_OK)
async def user_choice(user:Choice):
    if user.choice == "1":
        return {"Display":1}
    elif user.choice == "2":
        return {"Display":2}

@app.post("/add-task",status_code=status.HTTP_201_CREATED)
async def add_task(user:Task,db:db_dependency):
    db_task = Tasks(task=user.task,status="Incomplete")
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return {"message":"Task added!"}

@app.get("/view-tasks",status_code=status.HTTP_200_OK)
async def view_tasks(db:db_dependency,offset:int=0,limit:int=5):
    total_tasks = db.query(Tasks).count()
    tasks = db.query(Tasks).order_by(asc(Tasks.id)).offset(offset).limit(limit).all() 
    return {"tasks":tasks,"total_tasks":total_tasks}

@app.post("/delete-task/{task_id}",status_code=status.HTTP_200_OK)
async def mark_as_complete(task_id:int,db:db_dependency):
    db_task = db.query(Tasks).filter(Tasks.id == task_id).first()
    if db_task:
        db.delete(db_task)
        db.commit()
        return {"message":"Task deleted successfully"}

@app.post("/mark-as-complete/{task_id}",status_code=status.HTTP_200_OK)
async def mark_as_complete(task_id:int,db:db_dependency):
    db_task = db.query(Tasks).filter(Tasks.id == task_id).first()
    db_task.status="Completed"
    db.commit()
    db.refresh(db_task)
    return {"message":"Task marked as complete"}

