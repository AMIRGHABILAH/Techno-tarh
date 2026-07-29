export default function useKonvaHistory(stageRef){

let history = []
let step = -1

const save = () => {

const stage = stageRef.value
if(!stage) return

step++

history = history.slice(0, step)

history.push(stage.toJSON())

}

const undo = () => {

if(step <= 0) return

step--

const stage = stageRef.value
stage.destroyChildren()

stage.add(Konva.Node.create(history[step]))

}

const redo = () => {

if(step >= history.length - 1) return

step++

const stage = stageRef.value
stage.destroyChildren()

stage.add(Konva.Node.create(history[step]))

}

return { save, undo, redo }

}
