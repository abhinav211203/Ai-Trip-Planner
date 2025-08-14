import React from 'react'
import ChatBot from './_components/ChatBot'

function CreateNewTrip () {
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-5 p-10'>
      <div>
            <ChatBot/>
      </div>
      <div>
        Map and trip Plan to Display
      </div>
    </div>
  )
}
export default CreateNewTrip
