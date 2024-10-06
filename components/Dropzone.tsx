interface Props {
    id: number
    draggedTask: any
}

export default function Dropzone({ id, draggedTask }: Props) {
    function handleOnDrop() {
        console.log(`Task ${draggedTask} was dropped on ${id}`)
    }
    return (
        <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleOnDrop()}
            className="bg-slate-0 border-dashed border rounded-lg mb-3"
        >
            <div className="bg-slate-50 text-slate-500 p-3 pl-4 pr-4 w-12">
                {id}
            </div>
        </div>
    )
}
