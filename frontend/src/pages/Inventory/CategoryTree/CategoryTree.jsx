import React, { useState, useMemo, useEffect } from 'react';
import { ChevronRight, ChevronDown, Package, Folder, FolderOpen, Hash, Tag, Search, X } from 'lucide-react';

const CategoryTree = ({ items, selectedCategory, onCategorySelect, onClearFilter }) => {
    const [expandedCategories, setExpandedCategories] = useState(new Set(['All']));
    const [groupingMode, setGroupingMode] = useState('prefix'); // 'prefix', 'brand'
    const [searchQuery, setSearchQuery] = useState('');

    // Extract category value based on grouping mode
    const getCategoryValue = (item, mode) => {
        switch (mode) {
            case 'prefix':
                // For part number grouping, use the exact part number
                return item.partNumber || 'Unknown Part Number';
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
                type: 'root',
                path: 'All'
            } 
        };
        
        if (groupingMode === 'prefix') {
            // For part number grouping: All > Part Numbers (flat structure, no sub-folders)
            // Group by EXACT part number - no prefix extraction, no substring matching
            const partNumberGroups = new Map();
            
            items.forEach(item => {
                // Use exact part number as-is, trim whitespace but preserve the exact value
                const partNumber = (item.partNumber || 'Unknown Part Number').trim();
                
                // Ensure we're using the exact part number string (no normalization)
                if (!partNumberGroups.has(partNumber)) {
                    partNumberGroups.set(partNumber, {
                        count: 0,
                        items: []
                    });
                }
                
                const group = partNumberGroups.get(partNumber);
                group.count++;
                group.items.push(item);
            });
            
            // Create direct children under "All" - no sub-folders
            // Each node represents items with the EXACT same part number
            partNumberGroups.forEach((groupData, partNumber) => {
                // Use exact part number in path - this ensures exact matching in filtering
                // Path format: "All/5125" (exact part number, no modifications)
                tree['All'].children[partNumber] = {
                    count: groupData.count,
                    children: {}, // No children - flat structure
                    items: groupData.items,
                    type: 'partNumber',
                    path: `All/${partNumber}` // Exact path for exact matching
                };
            });
        } else {
            // For brand grouping: All > Brands > Part Numbers
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
            
            // Build tree structure for brand mode
            groupedItems.forEach((groupData, categoryValue) => {
                // Create category node (Brand)
                tree['All'].children[categoryValue] = {
                    count: groupData.count,
                    children: {},
                    items: groupData.items,
                    partNumbers: Array.from(groupData.partNumbers).sort(),
                    type: 'category',
                    path: `All/${categoryValue}`
                };
                
                // Create sub-groups by part number under each brand
                groupData.items.forEach(item => {
                    const partNumber = item.partNumber || 'Unknown';
                    if (!tree['All'].children[categoryValue].children[partNumber]) {
                        tree['All'].children[categoryValue].children[partNumber] = {
                            count: 0,
                            children: {},
                            items: [],
                            type: 'partNumber',
                            path: `All/${categoryValue}/${partNumber}`
                        };
                    }
                    tree['All'].children[categoryValue].children[partNumber].count++;
                    tree['All'].children[categoryValue].children[partNumber].items.push(item);
                });
            });
        }
        
        return tree;
    }, [items, groupingMode]);

    const categoryTree = buildCategoryTree;

    // Auto-expand nodes when searching
    useEffect(() => {
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            const nodesToExpand = new Set(['All']);
            
            const findMatchingNodes = (node, path = 'All') => {
                if (node.children) {
                    Object.entries(node.children).forEach(([childName, childNode]) => {
                        const childPath = node.path ? `${node.path}/${childName}` : `${path}/${childName}`;
                        
                        // Check if this node or its children match
                        const nameMatches = childName.toLowerCase().includes(query);
                        const itemsMatch = (childNode.items || []).some(item => {
                            const partNumber = (item.partNumber || '').toLowerCase();
                            const brand = (item.brand || '').toLowerCase();
                            const model = (item.model || '').toLowerCase();
                            const itemName = (item.name || '').toLowerCase();
                            return partNumber.includes(query) || brand.includes(query) || 
                                   model.includes(query) || itemName.includes(query);
                        });
                        
                        if (nameMatches || itemsMatch || (childNode.children && Object.keys(childNode.children).length > 0)) {
                            nodesToExpand.add(childPath);
                            if (childNode.children) {
                                findMatchingNodes(childNode, childPath);
                            }
                        }
                    });
                }
            };
            
            findMatchingNodes(categoryTree['All'], 'All');
            setExpandedCategories(nodesToExpand);
        } else {
            // Reset to just 'All' when search is cleared
            setExpandedCategories(new Set(['All']));
        }
    }, [searchQuery, categoryTree]);

    // Filter tree nodes based on search query
    const shouldShowNode = (node, name, path) => {
        if (!searchQuery.trim()) return true;
        
        const query = searchQuery.toLowerCase().trim();
        
        // Check if node name matches
        const nameMatches = name.toLowerCase().includes(query);
        
        // Check if any items in this node match
        const itemsMatch = (node.items || []).some(item => {
            const partNumber = (item.partNumber || '').toLowerCase();
            const brand = (item.brand || '').toLowerCase();
            const model = (item.model || '').toLowerCase();
            const itemName = (item.name || '').toLowerCase();
            
            return partNumber.includes(query) || 
                   brand.includes(query) || 
                   model.includes(query) ||
                   itemName.includes(query);
        });

        // Check if any children match (recursively)
        const childrenMatch = node.children && Object.entries(node.children).some(([childName, childNode]) => {
            const childPath = node.path ? `${node.path}/${childName}` : `${path}/${childName}`;
            return shouldShowNode(childNode, childName, childPath);
        });

        return nameMatches || itemsMatch || childrenMatch;
    };

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
        const fullPath = node.path || (path ? `${path}/${name}` : name);
        const isExpanded = expandedCategories.has(fullPath);
        const isSelected = selectedCategory === fullPath;
        const hasChildren = Object.keys(node.children || {}).length > 0;
        const nodeType = node.type || 'category';

        // Filter nodes based on search query
        if (!shouldShowNode(node, name, path)) {
            return null;
        }

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
                        // Only select on row click, don't expand/collapse
                        // Expansion/collapse is handled by the chevron button only
                        const isChevronClick = e.target.closest('.chevron-container');
                        if (!isChevronClick) {
                            // Make all nodes selectable (including folders)
                            onCategorySelect(fullPath === 'All' ? null : fullPath);
                        }
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
                            .filter(([childName, childNode]) => {
                                const childPath = node.path ? `${node.path}/${childName}` : `${fullPath}/${childName}`;
                                return shouldShowNode(childNode, childName, childPath);
                            })
                            .sort(([a], [b]) => {
                                // Sort part numbers naturally
                                if (nodeType === 'partNumber' || node.children[a]?.type === 'partNumber') {
                                    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
                                }
                                return a.localeCompare(b);
                            })
                            .map(([childName, childNode]) =>
                                renderCategoryNode(childName, childNode, fullPath, level + 1)
                            )
                            .filter(node => node !== null)}
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
            <div className="p-4 border-b border-gray-200 flex-shrink-0 bg-gray-50 space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-800 flex items-center">
                        <Hash size={16} className="mr-2" />
                        Categories
                    </h3>
                    {selectedCategory && (
                        <button
                            onClick={onClearFilter}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                        >
                            Clear
                        </button>
                    )}
                </div>
                
                {/* Search Input */}
                <div className="relative">
                    <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <Search size={14} />
                    </div>
                    <input
                        type="text"
                        placeholder={`Search ${getGroupingModeLabel(groupingMode).toLowerCase()}...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-8 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                {/* Group By Selector */}
                <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-600 font-medium">Group by:</label>
                    <select
                        value={groupingMode}
                        onChange={(e) => {
                            setGroupingMode(e.target.value);
                            setSearchQuery(''); // Clear search when changing mode
                            setExpandedCategories(new Set(['All'])); // Reset expanded categories
                            onCategorySelect(null); // Clear selection
                        }}
                        className="text-xs px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 flex-1 bg-white"
                    >
                        <option value="prefix">Part Number</option>
                        <option value="brand">Brand</option>
                    </select>
                </div>
                
                {/* Summary */}
                <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">
                        {getGroupingModeLabel(groupingMode)}: <span className="font-semibold text-gray-700">{Object.keys(categoryTree['All']?.children || {}).length}</span> {Object.keys(categoryTree['All']?.children || {}).length === 1 ? 'group' : 'groups'}
                    </span>
                    {searchQuery && (
                        <span className="text-blue-600 font-medium">
                            Filtering...
                        </span>
                    )}
                </div>
            </div>
            
            {/* Tree Content */}
            <div className="flex-1 overflow-y-auto p-2" style={{ minHeight: 0, maxHeight: '100%' }}>
                {(() => {
                    const renderedNodes = Object.entries(categoryTree)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([name, node]) => renderCategoryNode(name, node))
                        .filter(node => node !== null);
                    
                    if (renderedNodes.length === 0 && searchQuery) {
                        return (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <Search size={32} className="text-gray-300 mb-2" />
                                <p className="text-xs text-gray-500 font-medium">No results found</p>
                                <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
                            </div>
                        );
                    }
                    
                    return renderedNodes;
                })()}
            </div>
        </div>
    );
};

export default CategoryTree;
