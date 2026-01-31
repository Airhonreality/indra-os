import React from 'react';
import * as LucideIcons from 'lucide-react';

/**
 * 🎨 DYNAMIC ICON FACTORY
 * Mapea nombres de strings (de MasterLaw) a componentes de Lucide.
 */
const DynamicIcon = ({ name, size = 16, className = "", color = "currentColor", ...props }) => {
    const Icon = LucideIcons[name] || LucideIcons.HelpCircle;
    return <Icon size={size} className={className} color={color} {...props} />;
};

export default DynamicIcon;
