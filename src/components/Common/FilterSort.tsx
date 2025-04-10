import { Component, createSignal, For } from 'solid-js';
import { BiRegularFilter } from 'solid-icons/bi'
import { IoChevronUpOutline, IoChevronDownOutline } from 'solid-icons/io'
import { Motion } from "@motionone/solid"
import {
    Box,
    HStack,
    VStack,
    Select,
    SelectContent,
    SelectIcon,
    SelectListbox,
    SelectOption,
    SelectOptionIndicator,
    SelectOptionText,
    SelectPlaceholder,
    SelectTrigger,
    SelectValue,
    Text,
    Input,
    Button,
} from "@hope-ui/solid";

export interface FilterOption {
    label: string;
    value: string;
}

export interface SortOption {
    label: string;
    value: string;
}

export interface FilterSortProps {
    filters: {
      name: string;
      options: FilterOption[];
      selectedValues: string[];
      onFilterChange: (values: string[]) => void;
    }[];
    sorts: {
      label: string;
      value: string;
    }[];
    currentSort: string;
    onSortChange: (value: string) => void;
    searchValue: string;
    onSearchChange: (value: string) => void;
  }

export const FilterSort: Component<FilterSortProps> = (props) => {
    const [isExpanded, setIsExpanded] = createSignal(false);

    const clearFilters = () => {
        props.filters.forEach(filter => {
            filter.onFilterChange([]);
        });
        props.onSearchChange('');
        props.onSortChange(props.sorts[0].value);
    };

    return (
        <Box w="$full" mb="$6" p="$4" bg="white" rounded="$lg" shadow="sm" style={{'margin-bottom': '-2rem'}}>
            <HStack spacing="$4" justifyContent="space-between" mb="$4">
                <HStack 
                    spacing="$2" 
                    class="filter-title"
                    style={{
                        'display': 'flex',
                        'align-items': 'center',
                        'gap': '0.5rem'
                    }}
                >
                    <Motion
                        animate={{
                            rotate: isExpanded() ? 180 : 0
                        }}
                        transition={{ duration: 0.3 }}
                    >
                        <BiRegularFilter 
                            size={20} 
                            class="text-primary-600 filter-icon"
                            style={{
                                'color': '#1E3A8A',
                                'transform-origin': 'center'
                            }}
                        />
                    </Motion>
                    <Text 
                        size="lg" 
                        fontWeight="$medium" 
                        style={{
                            'font-family': 'Figtree',
                            'font-size': '0.97rem',
                            'display': 'flex',
                            'align-items': 'center',
                            'gap': '0.5rem'
                        }}
                    >
                        Filter & Sort
                    </Text>
                </HStack>
                
                <Button
                    onClick={() => setIsExpanded(!isExpanded())}
                    variant="ghost"
                    colorScheme="primary"
                    class="expand-button"
                    style={{
                        'font-family': 'Figtree',
                        'font-size': '0.97rem',
                        'display': 'flex',
                        'align-items': 'center',
                        'gap': '0.5rem',
                        'transition': 'all 0.2s ease',
                        'padding': '0.5rem 1rem',
                        'border-radius': '0.5rem',
                        'hover:bg-primary-50': true
                    }}
                >
                    <Motion
                        animate={{
                            rotate: isExpanded() ? 180 : 0
                        }}
                        transition={{ duration: 0.3 }}
                    >
                        {isExpanded() ? (
                            <IoChevronUpOutline size={18} />
                        ) : (
                            <IoChevronDownOutline size={18} />
                        )}
                    </Motion>
                </Button>
            </HStack>

            <Motion
                animate={{
                    height: isExpanded() ? 'auto' : 0,
                    opacity: isExpanded() ? 1 : 0
                }}
                transition={{ duration: 0.3 }}
                style={{
                    'overflow': 'hidden'
                }}
            >
                <VStack 
                    spacing="$4" 
                    alignItems="stretch"
                >
                    {/* Search Input */}
                    <Box>
                        <Text size="sm" fontWeight="$medium" mb="$2">Search</Text>
                        <Input
                            value={props.searchValue}
                            onInput={(e: { currentTarget: { value: string; }; }) => props.onSearchChange(e.currentTarget.value)}
                            placeholder="Search by name..."
                        />
                    </Box>

                    {/* Filters */}
                    <HStack spacing="$4" alignItems="flex-start" flexWrap="wrap">
                        <For each={props.filters}>
                            {(filter) => (
                                <Box flex="1" minW="200px">
                                    <Text size="sm" fontWeight="$medium" mb="$2">
                                        {filter.name}
                                    </Text>
                                    <Select
                                        multiple
                                        value={filter.selectedValues}
                                        onChange={(values: string[]) => filter.onFilterChange(values)}
                                    >
                                        <SelectTrigger>
                                            <SelectPlaceholder>Select {filter.name.toLowerCase()}</SelectPlaceholder>
                                            <SelectValue>
                                                {filter.selectedValues.length
                                                    ? `${filter.selectedValues.length} selected`
                                                    : `Select ${filter.name.toLowerCase()}`
                                                }
                                            </SelectValue>
                                            <SelectIcon />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectListbox>
                                                <For each={filter.options}>
                                                    {(option) => (
                                                        <SelectOption value={option.value}>
                                                            <SelectOptionText>{option.label}</SelectOptionText>
                                                            <SelectOptionIndicator />
                                                        </SelectOption>
                                                    )}
                                                </For>
                                            </SelectListbox>
                                        </SelectContent>
                                    </Select>
                                </Box>
                            )}
                        </For>

                        {/* Sort */}
                        <Box flex="1" minW="200px">
                            <Text size="sm" fontWeight="$medium" mb="$2">Sort By</Text>
                            <Select
                                value={props.currentSort}
                                onChange={(value: string) => props.onSortChange(value)}
                            >
                                <SelectTrigger>
                                    <SelectPlaceholder>Sort by...</SelectPlaceholder>
                                    <SelectValue />
                                    <SelectIcon />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectListbox>
                                        <For each={props.sorts}>
                                            {(sort) => (
                                                <SelectOption value={sort.value}>
                                                    <SelectOptionText>{sort.label}</SelectOptionText>
                                                    <SelectOptionIndicator />
                                                </SelectOption>
                                            )}
                                        </For>
                                    </SelectListbox>
                                </SelectContent>
                            </Select>
                        </Box>

                        {/* Clear Filters Button */}
                        <Box pt="$8">
                            <Button 
                                variant="outline" 
                                colorScheme="danger"
                                size="sm"
                                onClick={clearFilters}
                            >
                                Clear Filters
                            </Button>
                        </Box>
                    </HStack>

                    {/* Active Filters */}
                    <Box>
                        <HStack spacing="$2" flexWrap="wrap">
                            <For each={props.filters}>
                                {(filter) => (
                                    <For each={filter.selectedValues}>
                                        {(value) => {
                                            const option = filter.options.find(opt => opt.value === value);
                                            return (
                                                <Box 
                                                    bg="$primary100" 
                                                    color="$primary800"
                                                    px="$3"
                                                    py="$1"
                                                    rounded="$full"
                                                    display="inline-flex"
                                                    alignItems="center"
                                                >
                                                    {filter.name}: {option?.label}
                                                    <Button
                                                        ml="$2"
                                                        size="xs"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            const newValues = filter.selectedValues
                                                                .filter(v => v !== value);
                                                            filter.onFilterChange(newValues);
                                                        }}
                                                    >
                                                        ×
                                                    </Button>
                                                </Box>
                                            );
                                        }}
                                    </For>
                                )}
                            </For>
                        </HStack>
                    </Box>
                </VStack>
            </Motion>
        </Box>
    );
};