"use client"

import * as React from "react"
import { ChevronDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

export interface ItemOption<T = any> {
  value: string
  label: string
  data?: T
}

interface ItemInputProps {
  options: ItemOption[]
  value?: string
  suggestions?: ItemOption[]
  onValueChange?: (value: string, data?: any, label?: string) => void
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  className?: string
}

export function ItemInput({
  options = [],
  value = "",
  onValueChange,
  placeholder = "Type item description...",
  className,
  suggestions = [],
  onChange,
}: ItemInputProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState(value)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Filter options based on input
  const filteredOptions = React.useMemo(() => {
    const source = suggestions.length > 0 ? suggestions : options;
    if (!inputValue.trim()) return source;
    return source.filter((option: ItemOption) => 
      option.label.toLowerCase().includes(inputValue.toLowerCase())
    )
  }, [options, suggestions, inputValue])

  // Update input when value prop changes
  React.useEffect(() => {
    setInputValue(value)
  }, [value])

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    onChange?.(e)
    onValueChange?.(newValue)
    setIsOpen(true)
  }

  // Handle option selection
  const handleSelect = (option: ItemOption) => {
    setInputValue(option.label)
    onValueChange?.(option.value, option.data, option.label)
    setIsOpen(false)
    inputRef.current?.focus()
  }

  // Handle input focus
  const handleInputFocus = () => {
    if (!isOpen) {
      setIsOpen(true)
    }
  }

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className={cn('pr-10', className)}
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredOptions.length === 0 ? (
            <div className="px-4 py-2 text-sm text-gray-500">No items found</div>
          ) : (
            <ul>
              {filteredOptions.map((option) => (
                <li
                  key={option.value}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleSelect(option)}
                >
                  {option.label}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
