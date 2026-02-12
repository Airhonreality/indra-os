// ======================================================================
// ARTEFACTO: 3_Adapters/MapsAdapter.spec.js
// PROPÓSITO: Pruebas unitarias para el MapsAdapter.
// ======================================================================

function testMapsAdapter_Discovery() {
    const setup = _maps_setup();
    const adapter = createMapsAdapter(setup.deps);

    assert.exists(adapter.getTravelTime, 'Debe exponer getTravelTime');
    assert.exists(adapter.findNearby, 'Debe exponer findNearby');
    assert.exists(adapter.geocode, 'Debe exponer geocode');
}

function testMapsAdapter_GetTravelTime_Exito() {
    const setup = _maps_setup();
    const adapter = createMapsAdapter(setup.deps);

    globalThis.Maps = {
        newDirectionFinder: () => ({
            setOrigin: () => ({
                setDestination: () => ({
                    setMode: () => ({
                        getDirections: () => ({
                            status: 'OK',
                            routes: [{
                                legs: [{
                                    duration: { value: 600, text: '10 mins' },
                                    distance: { value: 5000, text: '5 km' }
                                }]
                            }]
                        })
                    })
                })
            })
        })
    };

    const result = adapter.getTravelTime({ origin: 'A', destination: 'B' });
    assert.areEqual(600, result.durationSeconds);
    assert.areEqual('10 mins', result.humanReadableDuration);
}

function _maps_setup() {
    return {
        deps: {
            errorHandler: {
                createError: (code, msg) => {
                    const e = new Error(msg);
                    e.code = code;
                    return e;
                }
            }
        }
    };
}
