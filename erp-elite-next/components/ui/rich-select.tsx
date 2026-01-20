"use client"

import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export interface RichSelectOption {
    id: string | number
    name: string
    [key: string]: any
}

interface RichSelectProps {
    options: RichSelectOption[]
    value?: string | number | (string | number)[]
    onValueChange: (value: any) => void
    placeholder?: string
    label?: string
    multiple?: boolean
    imageKey?: string
    disabled?: boolean
    showAvatar?: boolean
    onSearchChange?: (value: string) => void
    searchValue?: string
    shouldFilter?: boolean
}

export function RichSelect({
    options = [],
    value,
    onValueChange,
    placeholder = "Seleccionar...",
    label,
    multiple = false,
    imageKey = "image",
    disabled = false,
    showAvatar = true,
    onSearchChange,
    searchValue,
    shouldFilter = true,
}: RichSelectProps) {
    const [open, setOpen] = React.useState(false)

    const selectedOptions = React.useMemo(() => {
        if (multiple) {
            const values = Array.isArray(value) ? value : []
            return options.filter((option) => values.includes(option.id))
        }
        return options.find((option) => option.id === value)
    }, [options, value, multiple])

    const handleSelect = (optionId: string | number) => {
        if (multiple) {
            const currentValues = Array.isArray(value) ? [...value] : []
            const index = currentValues.indexOf(optionId)

            if (index === -1) {
                onValueChange([...currentValues, optionId])
            } else {
                const newValues = currentValues.filter((v) => v !== optionId)
                onValueChange(newValues)
            }
        } else {
            onValueChange(optionId === value ? undefined : optionId) // Allow deselect if same
            setOpen(false)
        }
    }

    const handleRemove = (e: React.MouseEvent, optionId: string | number) => {
        e.stopPropagation()
        if (multiple && Array.isArray(value)) {
            onValueChange(value.filter((v) => v !== optionId))
        } else {
            onValueChange(undefined)
        }
    }

    const getInitials = (name: string) => {
        if (!name) return ""
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .substring(0, 2)
            .toUpperCase()
    }

    const renderOptionImage = (option: RichSelectOption, className: string = "w-5 h-5") => {
        const rawImage = option[imageKey]
        const imageUrl =
            rawImage && typeof rawImage === "object" && "url" in rawImage
                ? rawImage.url
                : rawImage

        return (
            <Avatar className={className}>
                {imageUrl && typeof imageUrl === "string" && (
                    <AvatarImage src={imageUrl} alt={option.name} className="object-cover" />
                )}
                <AvatarFallback className="text-[10px] bg-gray-200 text-gray-500 font-medium">
                    {getInitials(option.name)}
                </AvatarFallback>
            </Avatar>
        )
    }


    return (
        <div className="flex flex-col gap-1.5">
            {label && <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{label}</label>}
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild disabled={disabled}>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        disabled={disabled}
                        className={cn(
                            "w-full justify-between min-h-[42px] h-auto px-3 py-2",
                            !value && "text-muted-foreground"
                        )}
                    >
                        {multiple ? (
                            <div className="flex flex-wrap gap-1 items-center">
                                {(selectedOptions as RichSelectOption[])?.length > 0 ? (
                                    (selectedOptions as RichSelectOption[]).map((option) => (
                                        <Badge key={option.id} variant="secondary" className="mr-1 mb-1 pl-1 pr-1 py-0.5 flex items-center gap-1 font-normal">
                                            {showAvatar && renderOptionImage(option, "w-4 h-4 mr-1")}
                                            <span>{option.name}</span>
                                            <div
                                                role="button"
                                                className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        handleRemove(e as any, option.id);
                                                    }
                                                }}
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                }}
                                                onClick={(e) => handleRemove(e, option.id)}
                                            >
                                                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                            </div>
                                        </Badge>
                                    ))
                                ) : (
                                    <span>{placeholder}</span>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-left truncate w-full">
                                {(selectedOptions as RichSelectOption) ? (
                                    <>
                                        {showAvatar && renderOptionImage(selectedOptions as RichSelectOption)}
                                        <span className="truncate">{(selectedOptions as RichSelectOption).name}</span>
                                    </>
                                ) : (
                                    <span>{placeholder}</span>
                                )}
                            </div>
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command shouldFilter={shouldFilter}>
                        <CommandInput
                            placeholder="Buscar..."
                            value={searchValue}
                            onValueChange={onSearchChange}
                        />
                        <CommandList>
                            <CommandEmpty>No se encontraron resultados.</CommandEmpty>
                            <CommandGroup>
                                {options.map((option) => (
                                    <CommandItem
                                        key={option.id}
                                        value={option.name} // Using name for filtering if Shadcn command filters by value
                                        onSelect={() => handleSelect(option.id)}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                multiple
                                                    ? (Array.isArray(value) && value.includes(option.id) ? "opacity-100" : "opacity-0")
                                                    : (value === option.id ? "opacity-100" : "opacity-0")
                                            )}
                                        />
                                        <div className="flex items-center gap-2">
                                            {showAvatar && renderOptionImage(option)}
                                            <span>{option.name}</span>
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    )
}
