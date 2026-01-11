import { type Theme } from '@emotion/react'
import { type SxProps } from '@mui/material'
import Card from '@mui/material/Card'
import { type ReactNode, memo } from 'react'
import { card_small, card_medium, card_large } from '../assets/styles/cards'

export interface CardProps {
    children: ReactNode
}

interface InternalCardProps {
    children: ReactNode
    theme: SxProps<Theme>
}

const InternalCard = memo<InternalCardProps>(({ children, theme }) => {
    return <Card sx={theme}>{children}</Card>
})

InternalCard.displayName = 'InternalCard'

export const SmallCard = memo<CardProps>(({ children }) => {
    return <InternalCard theme={card_small}>{children}</InternalCard>
})

SmallCard.displayName = 'SmallCard'

export const MediumCard = memo<CardProps>(({ children }) => {
    return <InternalCard theme={card_medium}>{children}</InternalCard>
})

MediumCard.displayName = 'MediumCard'

export const LargeCard = memo<CardProps>(({ children }) => {
    return <InternalCard theme={card_large}>{children}</InternalCard>
})

LargeCard.displayName = 'LargeCard'
