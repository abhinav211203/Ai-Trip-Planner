import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Minus, Plus } from "lucide-react"

interface DynamicDurationComponentProps {
  onSelected: (value: string) => void;
}

export const DynamicDurationComponent = ({ onSelected }: DynamicDurationComponentProps) => {
  const [days, setDays] = useState(1)

  const incrementDays = () => setDays((prev) => prev + 1)
  const decrementDays = () => setDays((prev) => Math.max(1, prev - 1))

  const handleConfirm = () => {
    onSelected(`${days} days`)
  }

  return (
    <div className="w-full max-w-sm mx-auto mt-2">
      <Card className="p-6 bg-white shadow-sm border">
        <div className="text-center space-y-4">
          <h3 className="text-lg font-medium text-gray-900">How many days?</h3>

          <div className="flex items-center justify-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={decrementDays}
              className="h-8 w-8 rounded-full border border-gray-300 hover:bg-gray-100"
            >
              <Minus className="h-4 w-4" />
            </Button>

            <span className="text-xl font-bold text-gray-900 min-w-[80px]">
              {days} {days === 1 ? 'Day' : 'Days'}
            </span>

            <Button
              variant="ghost"
              size="icon"
              onClick={incrementDays}
              className="h-8 w-8 rounded-full border border-gray-300 hover:bg-gray-100"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <Button
            onClick={handleConfirm}
            className="bg-primary hover:bg-primary text-white px-6 py-2 rounded-lg font-medium w-full"
          >
            Confirm
          </Button>
        </div>
      </Card>
    </div>
  )
}
