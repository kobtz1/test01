import React from 'react'
import { Card } from '../../card'



const ConversationFallback = () => {
  return (
    <Card className='hidden lg:flex h-full w-full p-2 items-center justify-center bg-secondary
    text-secondary-foreground'>
        เลือก/เริ่มการสนทนา
    </Card>
  )
}

export default ConversationFallback