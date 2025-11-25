import React, { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, Package, Folder, FolderOpen, Hash, Tag } from 'lucide-react';

const CategoryTree = ({ items, selectedCategory, onCategorySelect, onClearFilter }) => {
    const [expandedCategories, setExpandedCategories] = useState(new Set(['All']));
    const [groupingMode, setGroupingMode] = useState('prefix'); // 'prefix', 'brand'

    // Extract category value based on grouping mode
    const getCategoryValue = (item, mode) => {
        switch (mode) {
            case 'prefix':
                const partNumber = item.partNumber || '';
                const cleanPartNumber = partNumber.trim().toUpperCase();
                const prefixMatch = cleanPartNumber.match(/^([A-Z]+)/);
                if (prefixMatch) {
                    return prefixMatch[1];
                }
                return cleanPartNumber.charAt(0) || 'Unknown';
            case 'brand':
                return item.brand || 'Unknown Brand';
            default:
                return 'All';
        }
    };

    // Build hierarchical category tree
    const buildCategoryTree = useMemo(() => {
        const tree = { 
            'All': { 
                count: items.length, 
                children: {}, 
                items: [],
                type: 'root'
            } 
        };
        
        // Group items by the selected mode
        const groupedItems = new Map();
        
        items.forEach(item => {
            const categoryValue = getCategoryValue(item, groupingMode);
            
            if (!groupedItems.has(categoryValue)) {
                groupedItems.set(categoryValue, {
                    count: 0,
                    items: [],
                    partNumbers: new Set()
                });
            }
            
            const group = groupedItems.get(categoryValue);
            group.count++;
            group.items.push(item);
            group.partNumbers.add(item.partNumber);
        });
        
        // Build tree structure
        groupedItems.forEach((groupData, categoryValue) => {
            // Create category node
            tree['All'].children[categoryValue] = {
                count: groupData.count,
                children: {},
                items: groupData.items,
                partNumbers: Array.from(groupData.partNumbers).sort(),
                type: 'category'
            };
            
            // For part number grouping, create sub-groups by part number
            if (groupingMode === 'partNumber') {
                // Group by exact part number (already done, but we can add sub-grouping by brand/model)
                groupData.items.forEach(item => {
                    const partNumber = item.partNumber || 'Unknown';
                    if (!tree['All'].children[categoryValue].children[partNumber]) {
                        tree['All'].children[categoryValue].children[partNumber] = {
                            count: 0,
                            children: {},
                            items: [],
                            type: 'partNumber'
                        };
                    }
                    tree['All'].children[categoryValue].children[partNumber].count++;
                    tree['All'].children[categoryValue].children[partNumber].items.push(item);
                });
            } else {
                // For other modes, create sub-groups by part number
                groupData.items.forEach(item => {
                    const partNumber = item.partNumber || 'Unknown';
                    if (!tree['All'].children[categoryValue].children[partNumber]) {
                        tree['All'].children[categoryValue].children[partNumber] = {
                            count: 0,
                            children: {},
                            items: [],
                            type: 'partNumber'
                        };
                    }
                    tree['All'].children[categoryValue].children[partNumber].count++;
                    tree['All'].children[categoryValue].children[partNumber].items.push(item);
                });
            }
        });
        
        return tree;
    }, [items, groupingMode]);

    const categoryTree = buildCategoryTree;

    const toggleCategory = (categoryPath) => {
        setExpandedCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(categoryPath)) {
                newSet.delete(categoryPath);
            } else {
                newSet.add(categoryPath);
            }
            return newSet;
        });
    };

    const getIcon = (nodeType, hasChildren, isExpanded) => {
        if (hasChildren) {
            return isExpanded ? (
                <FolderOpen size={16} className="mr-2 text-gray-500" />
            ) : (
                <Folder size={16} className="mr-2 text-gray-500" />
            );
        }
        
        switch (nodeType) {
            case 'partNumber':
                return <Hash size={16} className="mr-2 text-gray-500" />;
            case 'category':
                if (groupingMode === 'brand') {
                    return <Tag size={16} className="mr-2 text-gray-500" />;
                }
                return <Hash size={16} className="mr-2 text-gray-500" />;
            default:
                return <Package size={16} className="mr-2 text-gray-500" />;
        }
    };

    const renderCategoryNode = (name, node, path = '', level = 0) => {
        const fullPath = path ? `${path}/${name}` : name;
        const isExpanded = expandedCategories.has(fullPath);
        const isSelected = selectedCategory === fullPath;
        const hasChildren = Object.keys(node.children || {}).length > 0;
        const nodeType = node.type || 'category';
        const isLeafNode = !hasChildren && level > 1;

        return (
            <div key={fullPath} className="select-none">
                <div
                    className={`flex items-center py-2 px-3 rounded-md cursor-pointer transition-colors ${
                        isSelected 
                            ? 'bg-blue-100 text-blue-700 font-medium border-l-2 border-blue-500' 
                            : 'hover:bg-gray-100 text-gray-700'
                    }`}
                    style={{ paddingLeft: `${12 + level * 16}px` }}
                    onClick={(e) => {
                        // Toggle expansion on chevron click, select on row click
                        const isChevronClick = e.target.closest('.chevron-container');
                        if (hasChildren && !isChevronClick) {
                            toggleCategory(fullPath);
                        }
                        // Make all nodes selectable (including folders)
                        onCategorySelect(fullPath === 'All' ? null : fullPath);
                    }}
                >
                    <div 
                        className="chevron-container mr-2"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (hasChildren) {
                                toggleCategory(fullPath);
                            }
                        }}
                    >
                        {hasChildren ? (
                            isExpanded ? (
                                <ChevronDown size={14} className="text-gray-500 cursor-pointer" />
                            ) : (
                                <ChevronRight size={14} className="text-gray-500 cursor-pointer" />
                            )
                        ) : (
                            <div className="w-[14px]" />
                        )}
                    </div>
                    {getIcon(nodeType, hasChildren, isExpanded)}
                    <span className="flex-1 text-sm font-medium truncate" title={name}>
                        {name}
                    </span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full ml-2 flex-shrink-0">
                        {node.count}
                    </span>
                </div>
                {hasChildren && isExpanded && (
                    <div className="ml-4">
                        {Object.entries(node.children)
                            .sort(([a], [b]) => {
                                // Sort part numbers naturally
                                if (nodeType === 'partNumber' || node.children[a]?.type === 'partNumber') {
                                    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
                                }
                                return a.localeCompare(b);
                            })
                            .map(([childName, childNode]) =>
                                renderCategoryNode(childName, childNode, fullPath, level + 1)
                            )}
                    </div>
                )}
            </div>
        );
    };

    const getGroupingModeLabel = (mode) => {
        switch (mode) {
            case 'prefix':
                return 'Part Number';
            case 'brand':
                return 'Brand';
            default:
                return 'Part Number';
        }
    };

    return (
        <div className="flex flex-col h-full" style={{ height: '100%', maxHeight: '100%' }}>
            <div className="p-4 border-b border-gray-200 flex-shrink-0 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-800 flex items-center">
                        <Hash size={16} className="mr-2" />
                        Categories
                    </h3>
                    {selectedCategory && (
                        <button
                            onClick={onClearFilter}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                            Clear
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-600">Group by:</label>
                    <select
                        value={groupingMode}
                        onChange={(e) => {
                            setGroupingMode(e.target.value);
                            // Reset expanded categories when changing mode
                            setExpandedCategories(new Set(['All']));
                        }}
                        className="text-xs px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 flex-1"
                    >
                        <option value="prefix">Part Number</option>
                        <option value="brand">Brand</option>
                    </select>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                    {getGroupingModeLabel(groupingMode)}: {Object.keys(categoryTree['All']?.children || {}).length} groups
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2" style={{ minHeight: 0, maxHeight: '100%' }}>
                {Object.entries(categoryTree)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([name, node]) => renderCategoryNode(name, node))}
            </div>
        </div>
    );
};

export default CategoryTree;
