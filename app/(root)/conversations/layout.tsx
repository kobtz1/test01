import ItemList from '@/components/ui/shared/item-list/ItemList'
import React from 'react'

type Props = React.PropsWithChildren <{}>

const ConversationsLayout = ({children}: Props) => {
    return (
        <><ItemList title='บทสนทนา'>ConversationsPage</ItemList>
        {children}</>
      )}

export default ConversationsLayout