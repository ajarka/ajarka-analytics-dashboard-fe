import { Component, For } from 'solid-js';

interface Tab {
    id: string;
    label: string;
}

interface TabsProps {
    tabs: Tab[];
    activeTab: string;
    onTabChange: (id: string) => void;
}

export const Tabs: Component<TabsProps> = (props) => {
    return (
        <div class="border-b border-gray-200">
            <nav class="-mb-px flex space-x-8">
                <For each={props.tabs}>
                    {(tab) => (
                        <button
                            class={`
                pb-4 px-1 border-b-2 font-medium text-sm
                ${props.activeTab === tab.id
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                            onClick={() => props.onTabChange(tab.id)}
                        >
                            {tab.label}
                        </button>
                    )}
                </For>
            </nav>
        </div>
    );
};