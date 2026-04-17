import { IndraIcon } from '../../../utilities/IndraIcons';
import { MIEConfigPanel } from '../widgets/MIEConfigPanel';
import { MIEDestinationPanel } from '../widgets/MIEDestinationPanel';

export const MIESidebar = ({ mieState, transportState }) => {
    return (
        <aside className="mie-engine-sidebar stack--loose">
            <div className="sidebar-section stack--tight">
                <div className="shelf--tight" style={{ opacity: 0.6 }}>
                    <IndraIcon name="LAYOUT" size="12px" />
                    <span className="font-syncopate" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>PERFIL DE COMPRESIÓN</span>
                </div>
                
                <MIEConfigPanel 
                    mieState={mieState}
                />
            </div>

            <div className="sidebar-section stack--tight" style={{ marginTop: '20px' }}>
                <div className="shelf--tight" style={{ opacity: 0.6 }}>
                    <IndraIcon name="INFO" size="12px" />
                    <span className="font-syncopate" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>DESTINO DE GESTIÓN</span>
                </div>
                
                <MIEDestinationPanel mieState={mieState} transportState={transportState} />
            </div>
        </aside>
    );
};
