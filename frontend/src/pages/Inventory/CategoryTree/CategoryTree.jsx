import React, { useState, useMemo, useEffect } from 'react';
import { ChevronRight, ChevronDown, Package, Folder, FolderOpen, Hash, Tag, Search, X } from 'lucide-react';

const CategoryTree = ({ items, selectedCategory, onCategorySelect, onClearFilter }) => {
    const [expandedCategories, setExpandedCategories] = useState(new Set(['All']));
    const [groupingMode, setGroupingMode] = useState('prefix'); // 'prefix', 'brand', 'name', 'model'
    const [searchQuery, setSearchQuery] = useState('');

    // Extract category value based on grouping mode
    const getCategoryValue = (item, mode) => {
        switch (mode) {
            case 'prefix':
                // For part number grouping, use the exact part number
                return item.partNumber || 'Unknown Part Number';
            case 'brand':
                return item.brand || 'Unknown Brand';
            case 'name':
                return item.name || 'Unknown Name';
            case 'model':
                return item.model || 'Unknown Model';
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
            // For part number grouping: All > Brands > Part Numbers (hierarchical)
            const brandGroups = new Map();
            
            items.forEach(item => {
                const brand = (item.brand || 'Unknown Brand').trim();
                const partNumber = (item.partNumber || 'Unknown Part Number').trim();
                
                if (!brandGroups.has(brand)) {
                    brandGroups.set(brand, {
                        count: 0,
                        items: [],
                        partNumbers: new Map()
                    });
                }
                
                const brandGroup = brandGroups.get(brand);
                brandGroup.count++;
                brandGroup.items.push(item);
                
                if (!brandGroup.partNumbers.has(partNumber)) {
                    brandGroup.partNumbers.set(partNumber, {
                        count: 0,
                        items: []
                    });
                }
                
                const partNumberGroup = brandGroup.partNumbers.get(partNumber);
                partNumberGroup.count++;
                partNumberGroup.items.push(item);
            });
            
            // Build hierarchical structure: All > Brands > Part Numbers
            brandGroups.forEach((brandData, brand) => {
                // Create brand node
                tree['All'].children[brand] = {
                    count: brandData.count,
                    children: {},
                    items: brandData.items,
                    type: 'category',
                    path: `All/${brand}`
                };
                
                // Create part number nodes under each brand
                brandData.partNumbers.forEach((partData, partNumber) => {
                    tree['All'].children[brand].children[partNumber] = {
                        count: partData.count,
                        children: {},
                        items: partData.items,
                        type: 'partNumber',
                        path: `All/${brand}/${partNumber}`
                    };
                });
            });
        } else if (groupingMode === 'brand') {
            // For brand grouping: All > Brands (flat structure, no sub-folders)
            const brandGroups = new Map();
            
            items.forEach(item => {
                const brand = (item.brand || 'Unknown Brand').trim();
                
                if (!brandGroups.has(brand)) {
                    brandGroups.set(brand, {
                        count: 0,
                        items: []
                    });
                }
                
                const group = brandGroups.get(brand);
                group.count++;
                group.items.push(item);
            });
            
            // Create direct children under "All" - no sub-folders
            brandGroups.forEach((groupData, brand) => {
                tree['All'].children[brand] = {
                    count: groupData.count,
                    children: {}, // No children - flat structure
                    items: groupData.items,
                    type: 'category',
                    path: `All/${brand}`
                };
            });
        } else if (groupingMode === 'name') {
            // For name grouping: All > Brands > Names (hierarchical)
            const brandGroups = new Map();
            
            items.forEach(item => {
                const brand = (item.brand || 'Unknown Brand').trim();
                const name = (item.name || 'Unknown Name').trim();
                
                if (!brandGroups.has(brand)) {
                    brandGroups.set(brand, {
                        count: 0,
                        items: [],
                        names: new Map()
                    });
                }
                
                const brandGroup = brandGroups.get(brand);
                brandGroup.count++;
                brandGroup.items.push(item);
                
                if (!brandGroup.names.has(name)) {
                    brandGroup.names.set(name, {
                        count: 0,
                        items: []
                    });
                }
                
                const nameGroup = brandGroup.names.get(name);
                nameGroup.count++;
                nameGroup.items.push(item);
            });
            
            // Build hierarchical structure: All > Brands > Names
            brandGroups.forEach((brandData, brand) => {
                // Create brand node
                tree['All'].children[brand] = {
                    count: brandData.count,
                    children: {},
                    items: brandData.items,
                    type: 'category',
                    path: `All/${brand}`
                };
                
                // Create name nodes under each brand
                brandData.names.forEach((nameData, name) => {
                    tree['All'].children[brand].children[name] = {
                        count: nameData.count,
                        children: {},
                        items: nameData.items,
                        type: 'category',
                        path: `All/${brand}/${name}`
                    };
                });
            });
        } else if (groupingMode === 'model') {
            // For model grouping: All > Brands > Models (hierarchical)
            const brandGroups = new Map();
            
            items.forEach(item => {
                const brand = (item.brand || 'Unknown Brand').trim();
                const model = (item.model || 'Unknown Model').trim();
                
                if (!brandGroups.has(brand)) {
                    brandGroups.set(brand, {
                        count: 0,
                        items: [],
                        models: new Map()
                    });
                }
                
                const brandGroup = brandGroups.get(brand);
                brandGroup.count++;
                brandGroup.items.push(item);
                
                if (!brandGroup.models.has(model)) {
                    brandGroup.models.set(model, {
                        count: 0,
                        items: []
                    });
                }
                
                const modelGroup = brandGroup.models.get(model);
                modelGroup.count++;
                modelGroup.items.push(item);
            });
            
            // Build hierarchical structure: All > Brands > Models
            brandGroups.forEach((brandData, brand) => {
                // Create brand node
                tree['All'].children[brand] = {
                    count: brandData.count,
                    children: {},
                    items: brandData.items,
                    type: 'category',
                    path: `All/${brand}`
                };
                
                // Create model nodes under each brand
                brandData.models.forEach((modelData, model) => {
                    tree['All'].children[brand].children[model] = {
                        count: modelData.count,
                        children: {},
                        items: modelData.items,
                        type: 'category',
                        path: `All/${brand}/${model}`
                    };
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
                        const childPath = childNode.path || `${path}/${childName}`;
                        
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
            setExpandedCategories(prev => {
                // Only update if the sets are different to prevent infinite loops
                const prevArray = Array.from(prev).sort();
                const newArray = Array.from(nodesToExpand).sort();
                if (prevArray.length !== newArray.length || 
                    prevArray.some((val, idx) => val !== newArray[idx])) {
                    return nodesToExpand;
                }
                return prev;
            });
        } else {
            // Reset to just 'All' when search is cleared
            setExpandedCategories(prev => {
                if (prev.size !== 1 || !prev.has('All')) {
                    return new Set(['All']);
                }
                return prev;
            });
        }
    }, [searchQuery, items, groupingMode]); // Use items and groupingMode instead of categoryTree to prevent infinite loops

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
                if (groupingMode === 'brand' || groupingMode === 'name' || groupingMode === 'model') {
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
            case 'name':
                return 'Name';
            case 'model':
                return 'Model';
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
                        <option value="name">Name</option>
                        <option value="model">Model</option>
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
