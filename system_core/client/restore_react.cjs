const fs = require('fs');
const path = require('path');

const conflicts = [
    'src/components/dashboard/AtomGlif.jsx',
    'src/components/macro_engines/AEEFormRunner/AEEConfigPanel.jsx',
    'src/components/macro_engines/AEEFormRunner/AEEGraphicPanel.jsx',
    'src/components/macro_engines/AEEFormRunner/AEE_Dashboard.jsx',
    'src/components/macro_engines/BridgeDesigner/PortManager.jsx',
    'src/components/macro_engines/DocumentDesigner/blocks/TextBlock.jsx',
    'src/components/macro_engines/DocumentDesigner/renderer/HonestProvider.jsx',
    'src/components/macro_engines/VideoDesigner/components/AutomationOverlay.jsx',
    'src/components/macro_engines/VideoDesigner/components/InspectorSidebar.jsx',
    'src/components/macro_engines/VideoDesigner/components/KineticTimeline.jsx',
    'src/components/macro_engines/VideoDesigner/components/RealityStreamer.jsx',
    'src/components/macro_engines/VideoDesigner/components/TimelineTrack.jsx',
    'src/components/macro_engines/VideoDesigner/VideoDesigner.jsx'
];

conflicts.forEach(relPath => {
    const fullPath = path.join(__dirname, relPath);
    if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        if (!content.includes('import React')) {
            // Restore at the top
            content = "import React from 'react';\n" + content;
            fs.writeFileSync(fullPath, content);
            console.log(`Restored: ${relPath}`);
        }
    }
});
