export function onDragStart (
  e: MouseEvent,
  callback: (delta: { x: number; y: number }, e: MouseEvent) => void,
  endCallback?: (e: MouseEvent) => void
) {
  const startPosition = {
    x: e.clientX,
    y: e.clientY
  }

  let prevPosition: { x: number; y: number } = startPosition

  const onMove = (e: MouseEvent) => {
    // const delta = {
    //   x: e.clientX - startPosition.x,
    //   y: e.clientY - startPosition.y,
    // };
    const delta = {
      x: e.clientX - prevPosition.x,
      y: e.clientY - prevPosition.y
    }
    prevPosition = {
      x: e.clientX,
      y: e.clientY
    }

    // console.log(delta);
    callback(delta, e)
  }
  window.addEventListener('mousemove', onMove)

  const remove = (e: MouseEvent) => {
    endCallback && endCallback(e)
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', remove)
  }
  window.addEventListener('mouseup', remove)
}
