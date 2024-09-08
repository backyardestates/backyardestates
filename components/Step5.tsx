'use client'

import { useState } from 'react'

import { StepProps } from '@/lib/props'

import Task from './Task'
import Dropzone from './Dropzone'

const Step5: React.FC<StepProps> = ({ setStep, setPreferences }) => {
    const handleClick = () => {
        setStep(6)
    }

    const initialTasks = [
        {
            id: '0',
            title: 'Lowest build cost',
        },
        {
            id: '1',
            title: 'Maximize rental income',
        },
        {
            id: '2',
            title: 'Maximize property value',
        },
    ]

    const [tasks, setTasks] = useState(initialTasks)
    const [draggedTask, setDraggedTask] = useState(null)
    /*
    const onDrop = (positionID: number) => {
         if (draggedTask === null || draggedTask === undefined) return
        console.log(`${draggedTask} was dropped at position ${positionID}`)
         const taskToMove = tasks.filter((task) => task.uniqueID === draggedTask)

         const updatedTasks = tasks.filter(
             (task) => task.uniqueID !== draggedTask
         )

         updatedTasks.splice(positionID, 0, {
             ...taskToMove[0],
              columnID: columnID,
         })

         console.log(updatedTasks)
         console.log(`positionID: ${positionID}`)

         setTasks(updatedTasks)
    }
         */

    return (
        <>
            <h1 className="scroll-m-20 text-3xl font-bold tracking-tight mb-6">
                Rank these ADU goals based on priority
            </h1>

            <div>
                <Dropzone id={1} draggedTask={draggedTask} />
                <Dropzone id={2} draggedTask={draggedTask} />
                <Dropzone id={3} draggedTask={draggedTask} />
                {tasks.map((task, index) => (
                    <Task
                        key={index}
                        id={task.id}
                        title={task.title}
                        setDraggedTask={setDraggedTask}
                        // onDrop={onDrop}
                    />
                ))}
            </div>

            <button
                className="bg-blue-500 w-full"
                onClick={() => handleClick()}
            >
                Continue
            </button>
        </>
    )
}

export default Step5
