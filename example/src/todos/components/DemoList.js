import React from 'react'
import PropTypes from 'prop-types'
import Todo from './Todo'

const DemoList = ({ instances, pages, total, isFirst, isLast, 
  gotoPage, next, prev, first, last, refresh }) => {
  const loadingEl = null;//loading ? <span>Loading ... </span> : null
  console.log('rendering demolist', instances, pages, total)
  return (
    <div>
      <h3>Completed Todos</h3>
      <ol>
        {instances.map(todo => {
          return <Todo
            key={todo.id}
            {...todo}
            onClick={() => {}}
            onDelete={() => {}}
          />
        }
        )}
      </ol>
      {loadingEl}
      <p>Total: {total} </p>
      <p>
        <a onClick={() => refresh()}> Refresh </a>
      </p>
      <p>
        <a onClick={() => first()}> First </a>
        <a onClick={() => prev()}> Prev </a>
        {pages.map((page) => <a onClick={() => gotoPage(page) } key={page}> {page} </a>)}
        <a onClick={() => next()}> Next </a>
        <a onClick={() => last()}> Last</a>
      </p>
    </div>
  )
}


export default DemoList