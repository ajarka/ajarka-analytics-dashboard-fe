import { Component, For } from 'solid-js';
import {
    Box,
    Text,
    Select,
    SelectTrigger,
    SelectPlaceholder,
    SelectValue,
    SelectIcon,
    SelectContent,
    SelectListbox,
    SelectOption,
    SelectOptionText,
    SelectOptionIndicator,
    Input,
    Button,
    HStack
} from "@hope-ui/solid";

interface UtilizationFiltersProps {
    searchQuery: () => string;
    setSearchQuery: (value: string) => void;
    workloadFilter: () => string[];
    setWorkloadFilter: (value: string[]) => void;
    sortBy: () => string;
    setSortBy: (value: string) => void;
}

export const UtilizationFilters: Component<UtilizationFiltersProps> = (props) => {
    const workloadCategories = [
        { label: "Critical Load (>90%)", value: "critical" },
        { label: "High Load (75-90%)", value: "high" },
        { label: "Optimal Load (50-75%)", value: "optimal" },
        { label: "Low Load (<50%)", value: "low" }
    ];

    const sortOptions = [
        { label: "Utilization (High to Low)", value: "utilization-desc" },
        { label: "Utilization (Low to High)", value: "utilization-asc" },
        { label: "Tasks (High to Low)", value: "tasks-desc" },
        { label: "Tasks (Low to High)", value: "tasks-asc" },
        { label: "Name (A to Z)", value: "name-asc" },
        { label: "Name (Z to A)", value: "name-desc" }
    ];

    return (
        <Box class="w-full bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
            <Text size="sm" fontWeight="$semibold" class="mb-3" style={{'font-family': 'Figtree'}}>
                🔍 Filters & Sorting
            </Text>
            
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Box>
                    <Text size="xs" mb="$2" color="$neutral11" style={{'font-family': 'Figtree'}}>Search Member</Text>
                    <Input
                        value={props.searchQuery()}
                        onInput={(e: { currentTarget: { value: any; }; }) => props.setSearchQuery(e.currentTarget.value)}
                        placeholder="Search by name..."
                        size="sm"
                    />
                </Box>

                <Box>
                    <Text size="xs" mb="$2" color="$neutral11" style={{'font-family': 'Figtree'}}>Workload Filter</Text>
                    <Select
                        multiple
                        value={props.workloadFilter()}
                        onChange={(values: string[]) => props.setWorkloadFilter(values)}
                        size="sm"
                    >
                        <SelectTrigger>
                            <SelectPlaceholder>Filter by workload...</SelectPlaceholder>
                            <SelectValue />
                            <SelectIcon />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectListbox>
                                <For each={workloadCategories}>
                                    {(category) => (
                                        <SelectOption value={category.value}>
                                            <SelectOptionText>{category.label}</SelectOptionText>
                                            <SelectOptionIndicator />
                                        </SelectOption>
                                    )}
                                </For>
                            </SelectListbox>
                        </SelectContent>
                    </Select>
                </Box>

                <Box>
                    <Text size="xs" mb="$2" color="$neutral11" style={{'font-family': 'Figtree'}}>Sort By</Text>
                    <Select
                        value={props.sortBy()}
                        onChange={(value: string) => props.setSortBy(value)}
                        size="sm"
                    >
                        <SelectTrigger>
                            <SelectPlaceholder>Sort by...</SelectPlaceholder>
                            <SelectValue />
                            <SelectIcon />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectListbox>
                                <For each={sortOptions}>
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

                <Box class="flex items-end">
                    <Button
                        variant="outline"
                        colorScheme="danger"
                        size="sm"
                        onClick={() => {
                            props.setSearchQuery("");
                            props.setWorkloadFilter([]);
                            props.setSortBy("utilization-desc");
                        }}
                        class="w-full"
                    >
                        Reset Filters
                    </Button>
                </Box>
            </div>

            {/* Active Filters Display */}
            {(props.workloadFilter().length > 0 || props.searchQuery()) && (
                <HStack spacing="$2" flexWrap="wrap" class="mt-3">
                    {props.workloadFilter().map((filter) => (
                        <Box
                            px="$2"
                            py="$1"
                            bg="$primary100"
                            color="$primary900"
                            borderRadius="$full"
                            fontSize="$xs"
                        >
                            {workloadCategories.find(cat => cat.value === filter)?.label}
                            <Button
                                variant="ghost"
                                size="xs"
                                ml="$1"
                                onClick={() => {
                                    const newFilters = props.workloadFilter().filter(f => f !== filter);
                                    props.setWorkloadFilter(newFilters);
                                }}
                            >
                                ×
                            </Button>
                        </Box>
                    ))}
                    {props.searchQuery() && (
                        <Box
                            px="$2"
                            py="$1"
                            bg="$primary100"
                            color="$primary900"
                            borderRadius="$full"
                            fontSize="$xs"
                        >
                            Search: {props.searchQuery()}
                            <Button
                                variant="ghost"
                                size="xs"
                                ml="$1"
                                onClick={() => props.setSearchQuery("")}
                            >
                                ×
                            </Button>
                        </Box>
                    )}
                </HStack>
            )}
        </Box>
    );
};