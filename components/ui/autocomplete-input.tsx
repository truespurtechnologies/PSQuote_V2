"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface AutocompleteOption {
  value: string
  label: string
}

interface AutocompleteInputProps {
  options: AutocompleteOption[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  className?: string
}

export function AutocompleteInput({
  options,
  value = "",
  onValueChange,
  placeholder = "Type or select...",
  className,
}: AutocompleteInputProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState(value)

  // Filter options based on input - show all if input is empty, filter if typing
  const filteredOptions = React.useMemo(() => {
    if (!inputValue.trim()) return options
    return options.filter((option) => option.label.toLowerCase().includes(inputValue.toLowerCase()))
  }, [options, inputValue])

  // Update input when value prop changes
  React.useEffect(() => {
    setInputValue(value)
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    onValueChange?.(newValue)
    // Always show dropdown when typing (even for custom text)
    if (!open) setOpen(true)
  }

  const handleSelectOption = (selectedValue: string) => {
    setInputValue(selectedValue)
    onValueChange?.(selectedValue)
    setOpen(false)
  }

  const handleInputClick = () => {
    // Open dropdown when clicking anywhere in the input field
    setOpen(true)
  }

  const handleInputFocus = () => {
    // Open dropdown when focusing on the field
    setOpen(true)
  }

  const handleInputBlur = () => {
    // Small delay to allow clicking on dropdown items
    setTimeout(() => {
      setOpen(false)
    }, 200)
  }

  return (
    <div className="relative">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Input
              value={inputValue}
              onChange={handleInputChange}
              onClick={handleInputClick}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              placeholder={placeholder}
              className={cn("pr-8", className)}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-2 hover:bg-transparent"
              onClick={() => setOpen(!open)}
              tabIndex={-1}
            >
              <ChevronDown className={cn("h-4 w-4 text-gray-500 transition-transform", open && "rotate-180")} />
            </Button>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandList>
              {filteredOptions.length === 0 ? (
                <div className="p-4 text-sm text-gray-500">
                  {inputValue.trim() ? (
                    <div>
                      <p>No matching items found.</p>
                      <p className="mt-1 text-xs">You can still use "{inputValue}" as a custom item.</p>
                    </div>
                  ) : (
                    "Start typing to see suggestions or enter custom text."
                  )}
                </div>
              ) : (
                <CommandGroup>
                  {/* Show current input as first option if it's not in the list */}
                  {inputValue.trim() &&
                    !filteredOptions.some((opt) => opt.label.toLowerCase() === inputValue.toLowerCase()) && (
                      <CommandItem
                        value={inputValue}
                        onSelect={() => handleSelectOption(inputValue)}
                        className="cursor-pointer border-b border-gray-100"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">Use: "{inputValue}"</span>
                          <span className="text-xs text-gray-500">Custom item</span>
                        </div>
                      </CommandItem>
                    )}
                  {filteredOptions.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.label}
                      onSelect={() => handleSelectOption(option.label)}
                      className="cursor-pointer"
                    >
                      <div className="flex flex-col">
                        <span>{option.label}</span>
                        <span className="text-xs text-gray-500">From catalog</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
