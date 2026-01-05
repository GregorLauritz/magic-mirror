import { Theme } from '@emotion/react'
import { SxProps } from '@mui/material'
import Card from '@mui/material/Card/Card'
import { ReactNode, memo } from 'react'
import { card_small, card_medium, card_large } from '../assets/styles/cards'

export interface CardProps {
    children: ReactNode
}

interface ICardProps {
    children: ReactNode
    theme: SxProps<Theme>
}

const ICard = memo<ICardProps>(({ children, theme }) => {
    return <Card sx={theme}>{children}</Card>
})

ICard.displayName = 'ICard'

export const SmallCard = ({ children }: CardProps) => {
    return <ICard theme={card_small}>{children}</ICard>
}

export const MediumCard = ({ children }: CardProps) => {
    return <ICard theme={card_medium}>{children}</ICard>
}

export const LargeCard = ({ children }: CardProps) => {
    return <ICard theme={card_large}>{children}</ICard>
}
