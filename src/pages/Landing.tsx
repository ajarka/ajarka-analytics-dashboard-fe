import { Component } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { Card } from '../components/UI/Card';
import { VStack, HStack, Text, Box, Button } from '@hope-ui/solid';
import { FaSolidChartLine, FaSolidUsers } from 'solid-icons/fa';

export const Landing: Component = () => {
    const navigate = useNavigate();

    return (
        <div class="min-h-[80vh] flex items-center justify-center">
            <VStack spacing="$8" alignItems="stretch" maxW="$3xl" w="$full" mx="auto">
                <Box textAlign="center" mb="$8">
                    <Text size="4xl" fontWeight="bold" color="$primary11">
                        GitHub Team Analytics
                    </Text>
                    <Text size="xl" color="$neutral11" mt="$2">
                        Monitor progress and optimize resource utilization
                    </Text>
                </Box>

                <div class="grid md:grid-cols-2 gap-6">
                    {/* Progress Overview Card */}
                    <Box 
                        onClick={() => navigate('/')} 
                        cursor="pointer"
                    >
                        <Card class="hover:shadow-lg transition-all duration-300">
                            <VStack spacing="$4" alignItems="flex-start" p="$4">
                                <Box 
                                    p="$4" 
                                    borderRadius="$lg" 
                                    bg="$primary2"
                                >
                                    <FaSolidChartLine class="w-8 h-8 text-primary-600" />
                                </Box>
                                <Text size="xl" fontWeight="bold">Progress Overview</Text>
                                <Text color="$neutral11">
                                    Track project progress, monitor task completion, and analyze team performance across repositories.
                                </Text>
                                <HStack spacing="$2" color="$primary11">
                                    <span>View progress</span>
                                    <span>→</span>
                                </HStack>
                            </VStack>
                        </Card>
                    </Box>

                    {/* Resource Utilization Card */}
                    <Box 
                        onClick={() => navigate('/utilization')}
                        cursor="pointer"
                    >
                        <Card class="hover:shadow-lg transition-all duration-300">
                            <VStack spacing="$4" alignItems="flex-start" p="$4">
                                <Box 
                                    p="$4" 
                                    borderRadius="$lg" 
                                    bg="$success2"
                                >
                                    <FaSolidUsers class="w-8 h-8 text-success-600" />
                                </Box>
                                <Text size="xl" fontWeight="bold">Resource Utilization</Text>
                                <Text color="$neutral11">
                                    Analyze team workload, optimize resource allocation, and ensure balanced task distribution.
                                </Text>
                                <HStack spacing="$2" color="$success11">
                                    <span>View utilization</span>
                                    <span>→</span>
                                </HStack>
                            </VStack>
                        </Card>
                    </Box>
                </div>

                {/* Quick Actions */}
                <HStack 
                    spacing="$4" 
                    justifyContent="center" 
                    mt="$8"
                    display={{ base: 'none', md: 'flex' }}
                >
                    <Button
                        colorScheme="primary"
                        size="lg"
                        onClick={() => navigate('/')}
                    >
                        View Progress Overview
                    </Button>
                    <Button
                        colorScheme="success"
                        size="lg"
                        variant="outline"
                        onClick={() => navigate('/utilization')}
                    >
                        Check Resource Utilization
                    </Button>
                </HStack>
            </VStack>
        </div>
    );
};