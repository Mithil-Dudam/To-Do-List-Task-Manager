import { useEffect, useState } from 'react'
import './App.css'
import api from './api'
import {ChevronRight, ChevronLeft } from "lucide-react"

function App() {

  const [display,setDisplay] = useState<number>(1)
  const [task,setTask] = useState<string>("")
  const [tasks,setTasks] = useState<{id:number,task:string,status:string}[]>([])
  const [offset,setOffset] = useState(0)
  const limit=5
  const [totalTasks,setTotalTasks] = useState(0)
  const [message,setMessage] = useState<string>("")
  const [error,setError] = useState<string|null>(null)
  
  const HandleButtonCLick = async (e:React.MouseEvent<HTMLButtonElement>) => {
    const selectedChoice = e.currentTarget.value
    setError(null)
    try{
      const response = await api.post("/user-choice",{choice:selectedChoice})
      if(response.status === 200){
        setDisplay(response.data.Display)
      }
    }catch(error:any){
      console.error(error)
      setError("Error: Couldnt get display")
    }
  }

  const HandleAddTask = async (e:React.MouseEvent<HTMLButtonElement>) => { 
    setError(null)
    if(task === ""){
      setError("Cant add an empty task.")
      return
    }
    try{
      const response = await api.post("/add-task",{task:task})
      if(response.status === 201){
        setMessage(response.data.message)
        setTask("")
        AllTasks()
      }
    }catch(error:any){
      console.error(error)
      if(error.response){
        setError("Error: "+error.response.data.detail)
      }else{
        setError("Error: Couldnt add the task")
      }
    }
  }

  const AllTasks = async () =>{
    try{
      const response = await api.get(`/view-tasks?offset=${offset}&limit=${limit}`)
      if(response.status === 200){
        setTasks(response.data.tasks)
        setTotalTasks(response.data.total_tasks)
      }
    }catch(error:any){
      console.error(error)
      setError("Error: Couldnt get tasks")
    }
  }

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 2000);
      return () => clearTimeout(timer);
    }
  }, [message])

  useEffect(()=>{
    if(display===2){
      setMessage("")
      AllTasks()
    }
  },[display,offset])

  const totalPages = Math.ceil(totalTasks / limit)
  const currentPage = Math.floor(offset / limit) + 1

  const nextPage = () => {
    if (offset + limit < totalTasks) setOffset(offset + limit)
  }

  const prevPage = () => {
    if (offset - limit >= 0) setOffset(offset - limit)
  }

  const DeleteTask = async (taskId:number) => {
    setError(null)

    try{
      const response = await api.post(`/delete-task/${taskId}`)
      if(response.status===200){
        AllTasks()
      }
    }catch(error:any){
      console.error(error)
      setError("Error: Couldnt delete task")
    }
  }

  const TaskComplete = async (taskId:number) => {
    setError(null)
    try{
      const response = await api.post(`/mark-as-complete/${taskId}`)
      if(response.status === 200){
        AllTasks()
      }
    }catch(error:any){
      console.error(error)
      setError("Error: Couldnt mark task as complete")
    }
  }

  return (
    <div>
      <div>
        <h1 className=' text-center border-2 mt-5 mx-10 font-semibold text-6xl pb-3 pt-1'>To-Do List / Task Manager</h1>
      </div>
      <div className='flex justify-between mt-10 mx-10 font-semibold text-lg'>
        <button onClick={HandleButtonCLick} value="1" className='border-2 py-1 w-full cursor-pointer mr-5'>Add Task</button>
        <button onClick={HandleButtonCLick} value="2" className='border-2 w-full cursor-pointer'>View Tasks</button>
      </div>
      <div className='mt-10 mx-10 border-2'>
        {display === 1 && 
          <div className='flex flex-col items-center justify-center'>
            <label className='text-xl my-2 pl-5 font-semibold'>Enter Task:<span className={`ml-3 ${error ? "text-red-500":"text-green-600"}`}>{error||message}</span></label>
            <textarea className='w-full h-45 border p-1' placeholder='Type Your Task...' value={task} onChange={(e)=>setTask(e.target.value)}></textarea>
            <button className='my-5 font-semibold text-lg border-2 w-60 cursor-pointer' onClick={HandleAddTask}>Add Task</button>
          </div>
        }
        {display === 2 && 
          <div>
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr>
                  <th className="border border-gray-300 px-4 py-2 w-[60%]">Tasks</th>
                  <th className="border border-gray-300 px-4 py-2">Status</th>
                  <th className="border border-gray-300 px-4 py-2">Options</th>
                </tr>
             </thead>
             <tbody>
                {tasks.length > 0 ? (
                tasks.map((task) => (
                <tr key={task.id} className="border-b border-gray-300 hover:bg-gray-100">
                  <td className="border border-gray-300 px-4 py-2">{task.task}</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">{task.status}</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <div className="flex justify-center">
                      <button 
                      onClick={() => TaskComplete(task.id)} 
                      className="  border-green-600 border-2 px-3 py-1 rounded mr-5 hover:bg-green-500 hover:text-white cursor-pointer"
                      >
                      Mark Task as Complete
                      </button>
                      <button 
                      onClick={() => DeleteTask(task.id)} 
                      className="  px-3 py-1 rounded border-red-500 border-2 hover:bg-red-500 hover:text-white cursor-pointer"
                      >
                      Delete Task
                      </button>
                    </div>
                  </td>
                </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="text-center text-gray-500 py-4">No Tasks.</td>
                </tr>
              )}
              </tbody>
            </table>
            <div className='flex justify-between items-center my-3 px-5'>
              <div>
                <span className="font-semibold">Showing Page <span className='font-bold text-lg'>{currentPage}</span> out of <span className='font-bold text-lg'>{totalPages}</span></span>
              </div>
              <div className="items-center">
                <button onClick={prevPage} disabled={offset === 0} className="px-4 py-2 mx-2 disabled:opacity-50 cursor-pointer"><ChevronLeft/></button>
                <button onClick={nextPage} disabled={offset + limit >= totalTasks} className="px-4 py-2 mx-2 disabled:opacity-50 cursor-pointer"><ChevronRight/></button>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  )
}

export default App
