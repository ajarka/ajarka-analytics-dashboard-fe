import { Component } from 'solid-js';
import { HStack, Button, Box, Text, VStack, Alert, AlertDescription } from "@hope-ui/solid";
import { Card } from '../UI/Card';
import type { HistoricalData } from '../../types/analysis';

interface DataUploaderProps {
    onSaveProgress: () => void;
    onHistoricalUpload: (data: HistoricalData) => void;
    error: string;
}

export const DataUploader: Component<DataUploaderProps> = (props) => {
    const validateHistoricalData = (data: any): data is HistoricalData => {
        try {
            // Log full data structure for debugging
            (window as any).DebugLogger.log("Validating data structure:", JSON.stringify(data, null, 2));

            // Basic structure check
            if (!data || typeof data !== 'object') {
                (window as any).DebugLogger.error("Data is null or not an object");
                return false;
            }

            // Check for existence of required arrays
            const requiredArrays = ['projects', 'issues', 'members', 'pullRequests', 'commits'];
            for (const arr of requiredArrays) {
                if (!Array.isArray(data[arr])) {
                    (window as any).DebugLogger.error(`Missing or invalid ${arr} array`);
                    return false;
                }
            }

            // Validate projects structure with detailed logging
            for (const project of data.projects) {
                if (!project.number || !project.name || !Array.isArray(project.issues)) {
                    (window as any).DebugLogger.error("Invalid project structure:", project);
                    return false;
                }
            }

            // Validate issues structure with detailed logging
            for (const issue of data.issues) {
                if (!issue.number || 
                    !issue.repository?.name || 
                    typeof issue.state !== 'string') {
                    (window as any).DebugLogger.error("Invalid issue structure:", issue);
                    return false;
                }
                // body can be null or string
                if (issue.body !== null && typeof issue.body !== 'string') {
                    (window as any).DebugLogger.error("Invalid issue body:", issue.body);
                    return false;
                }
            }

            // Validate members with detailed logging
            for (const member of data.members) {
                if (typeof member.login !== 'string') {
                    (window as any).DebugLogger.error("Invalid member structure:", member);
                    return false;
                }
            }

            // All validations passed
            (window as any).DebugLogger.log("Data validation successful");
            return true;
        } catch (error) {
            (window as any).DebugLogger.error("Validation error:", error);
            return false;
        }
    };

    const handleFileUpload = async (e: Event) => {
        try {
            const target = e.target as HTMLInputElement;
            if (!target.files?.length) {
                (window as any).DebugLogger.log("No file selected");
                return;
            }

            const file = target.files[0];
            (window as any).DebugLogger.log("Processing file:", file.name);

            const text = await file.text();
            (window as any).DebugLogger.log("File content length:", text.length);

            let data;
            try {
                data = JSON.parse(text);
                (window as any).DebugLogger.log("Successfully parsed JSON");
            } catch (parseError) {
                (window as any).DebugLogger.error("JSON parse error:", parseError);
                throw new Error("Failed to parse JSON file. Please ensure the file is valid JSON.");
            }

            if (!validateHistoricalData(data)) {
                throw new Error(
                    "Invalid data structure. The file must contain GitHub data with projects, issues, and members."
                );
            }

            // If we get here, the data is valid
            (window as any).DebugLogger.log("File processed successfully");
            props.onHistoricalUpload(data);

        } catch (err) {
            (window as any).DebugLogger.error('Error processing file:', err);
            const errorMessage = err instanceof Error 
                ? err.message 
                : "Error processing file. Please ensure it's a valid JSON file.";
            
            // Reset file input
            const fileInput = document.getElementById('historical-upload') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
            
            throw new Error(errorMessage);
        }
    };

    return (
        <Card>
            <VStack spacing="$4">
                <HStack spacing="$4" wrap="wrap">
                    <Button
                        colorScheme="primary"
                        onClick={props.onSaveProgress}
                        leftIcon={<Box class="i-fa-solid-download" />}
                    >
                        Save Current Progress
                    </Button>
                    
                    <Box>
                        <input
                            type="file"
                            accept=".json"
                            onChange={(e) => {
                                try {
                                    handleFileUpload(e);
                                } catch (error) {
                                    const errorMessage = error instanceof Error 
                                        ? error.message 
                                        : "Unknown error occurred";
                                    (window as any).DebugLogger.error(errorMessage);
                                }
                            }}
                            style={{ display: 'none' }}
                            id="historical-upload"
                        />
                        <Button
                            as="label"
                            htmlFor="historical-upload"
                            cursor="pointer"
                            colorScheme="accent"
                            leftIcon={<Box class="i-fa-solid-upload" />}
                        >
                            Upload Historical Data
                        </Button>
                    </Box>
                </HStack>

                {props.error && (
                    <Alert 
                        status="danger" 
                        variant="left-accent"
                    >
                        <AlertDescription>
                            {props.error}
                        </AlertDescription>
                    </Alert>
                )}

                <Text size="sm" color="$neutral11">
                    Upload a previously saved progress JSON file for comparison
                </Text>
            </VStack>
        </Card>
    );
};