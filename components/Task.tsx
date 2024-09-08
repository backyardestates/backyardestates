import { MoveIcon } from '@radix-ui/react-icons'

interface Props {
    id: string
    title: string
    setDraggedTask: Function
    // onDrop: Function
}

export default function Task({ id, title, setDraggedTask }: Props) {
    return (
        <div
            draggable
            onDragStart={() => setDraggedTask(id)}
            // onDragEnd={() => setDraggedTask(null)}
            // onDragStart={() => console.log('Start')}
            // onDragEnd={() => console.log('End')}
            className=" flex gap-3 items-center bg-slate-50 border border-slate-200 p-3 rounded-lg text-slate-500 mb-3 pl-4"
        >
            <MoveIcon className="text-slate-400" />
            <h3>{`${id} - ${title}`}</h3>
        </div>
    )
}
