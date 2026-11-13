import {initI2C} from './i2c.mjs';
import {initBoundary,initIo} from './interface-basics.mjs';
import {initUart,initSpi} from './serial-links.mjs';
import {initDdr,initPcie,initUsb,initEthernet} from './channel-links.mjs';
import {initMipi,initCan,initSerdes,initSignalIntegrity,initBudget,initDebug} from './bus-quality.mjs';
import {initSocRequirements,initSocMap,initSocRegister,initSocCoherence} from './soc-architecture.mjs';
import {initSocDma,initSocIrq,initSocClock,initSocBoot} from './soc-control.mjs';
import {initSocQos,initSocPower,initSocAccess} from './soc-system.mjs';
import {initSocPerformance,initSocVerification,initSocProducts} from './soc-analysis.mjs';
import {initAiWorkload,initAiNumerics,initAiMac,initAiArray} from './ai-numerics.mjs';
import {initAiDataflow,initAiTiling,initAiMemory,initAiOverlap} from './ai-data.mjs';
import {initAiActivation,initAiSparse,initAiAttention,initAiCompiler} from './ai-operators.mjs';
import {initAiPerformance,initAiVerification,initAiProject} from './ai-system.mjs';
import {initDeviceJunction,initDeviceMos} from './device-physics.mjs';
import {initDeviceInterconnect,initDeviceStructures,initDeviceVariation,initDeviceSpecial} from './device-process.mjs';
import {initCmosInverter,initCmosGates,initCmosDelay,initCmosPower} from './cmos-analysis.mjs';
import {initCmosStorage} from './cmos-storage.mjs';
import {initCmosLayout,initCmosCustom} from './cmos-layout.mjs';
import {initAnalogSpecs,initAnalogBias,initAnalogAmplifier} from './analog-foundations.mjs';
import {initAnalogFeedback,initAnalogNoise,initAnalogLayout} from './analog-feedback-noise.mjs';
import {initAnalogAdc,initAnalogDac} from './analog-converters.mjs';
import {initAnalogPll,initAnalogRf} from './analog-clocks-rf.mjs';
import {initAnalogPowerSensor,initAnalogMixed} from './analog-system.mjs';

window.GuidebookPage.registerInitializer(()=>{
    // These section-based chapters show the active, registry-compiled label
    // in the existing page menu, matching the section heading.
    const readToc=window.GuidebookPageCustomToc;
    if(document.body.classList.contains('technical-curriculum')&&typeof readToc==='function'){
        window.GuidebookPageCustomToc=()=>{const state=readToc(),active=state?.items?.find(item=>item.active);return active?{...state,title:active.label}:state;};
        window.GuidebookPage.notifyPageToc();
    }
    document.querySelectorAll('[data-technical-section="i2c"]').forEach(initI2C);
    document.querySelectorAll('[data-technical-section="boundary"]').forEach(initBoundary);
    document.querySelectorAll('[data-technical-section="io"]').forEach(initIo);
    document.querySelectorAll('[data-technical-section="uart"]').forEach(initUart);
    document.querySelectorAll('[data-technical-section="spi"]').forEach(initSpi);
    document.querySelectorAll('[data-technical-section="ddr"]').forEach(initDdr);
    document.querySelectorAll('[data-technical-section="pcie"]').forEach(initPcie);
    document.querySelectorAll('[data-technical-section="usb"]').forEach(initUsb);
    document.querySelectorAll('[data-technical-section="ethernet"]').forEach(initEthernet);
    document.querySelectorAll('[data-technical-section="mipi"]').forEach(initMipi);
    document.querySelectorAll('[data-technical-section="can"]').forEach(initCan);
    document.querySelectorAll('[data-technical-section="serdes"]').forEach(initSerdes);
    document.querySelectorAll('[data-technical-section="signal-integrity"]').forEach(initSignalIntegrity);
    document.querySelectorAll('[data-technical-section="interface-budget"]').forEach(initBudget);
    document.querySelectorAll('[data-technical-section="interface-debug"]').forEach(initDebug);
    const socInitializers={
        'soc-requirements':initSocRequirements,'soc-map':initSocMap,'soc-register':initSocRegister,
        'soc-coherence':initSocCoherence,'soc-dma':initSocDma,'soc-irq':initSocIrq,
        'soc-clock':initSocClock,'soc-boot':initSocBoot,'soc-qos':initSocQos,
        'soc-power':initSocPower,'soc-access':initSocAccess,'soc-performance':initSocPerformance,
        'soc-verification':initSocVerification,'soc-products':initSocProducts
    };
    for(const [kind,init] of Object.entries(socInitializers))document.querySelectorAll(`[data-technical-section="${kind}"]`).forEach(init);
    const aiInitializers={
        'ai-workload':initAiWorkload,'ai-numerics':initAiNumerics,'ai-mac':initAiMac,'ai-array':initAiArray,
        'ai-dataflow':initAiDataflow,'ai-tiling':initAiTiling,'ai-memory':initAiMemory,'ai-overlap':initAiOverlap,
        'ai-activation':initAiActivation,'ai-sparse':initAiSparse,'ai-attention':initAiAttention,'ai-compiler':initAiCompiler,
        'ai-performance':initAiPerformance,'ai-verification':initAiVerification,'ai-project':initAiProject
    };
    for(const [kind,init] of Object.entries(aiInitializers))document.querySelectorAll(`[data-technical-section="${kind}"]`).forEach(init);
    const deviceInitializers={'device-junction':initDeviceJunction,'device-mos':initDeviceMos,'device-interconnect':initDeviceInterconnect,'device-structures':initDeviceStructures,'device-variation':initDeviceVariation,'device-special':initDeviceSpecial};
    for(const [kind,init] of Object.entries(deviceInitializers))document.querySelectorAll(`[data-technical-section="${kind}"]`).forEach(init);
    const cmosInitializers={'cmos-inverter':initCmosInverter,'cmos-gates':initCmosGates,'cmos-delay':initCmosDelay,'cmos-power':initCmosPower,'cmos-storage':initCmosStorage,'cmos-layout':initCmosLayout,'cmos-custom':initCmosCustom};
    for(const [kind,init] of Object.entries(cmosInitializers))document.querySelectorAll(`[data-technical-section="${kind}"]`).forEach(init);
    const analogInitializers={'analog-specs':initAnalogSpecs,'analog-bias':initAnalogBias,'analog-amplifier':initAnalogAmplifier,'analog-feedback':initAnalogFeedback,'analog-noise':initAnalogNoise,'analog-adc':initAnalogAdc,'analog-dac':initAnalogDac,'analog-pll':initAnalogPll,'analog-rf':initAnalogRf,'analog-power-sensor':initAnalogPowerSensor,'analog-layout':initAnalogLayout,'analog-mixed':initAnalogMixed};
    for(const [kind,init] of Object.entries(analogInitializers))document.querySelectorAll(`[data-technical-section="${kind}"]`).forEach(init);
    document.querySelectorAll('[data-technical-section]').forEach(root=>{
        root.addEventListener('input',event=>{
            const form=event.target.form;if(!form)return;
            let error=form.querySelector('.tech-form-error');
            if(!error){error=document.createElement('p');error.className='tech-form-error';error.setAttribute('role','alert');form.append(error);}
            const invalid=[...form.elements].find(input=>input.validity&&!input.validity.valid);
            error.hidden=!invalid;error.textContent=invalid?'입력 범위와 단위를 확인해 주세요. 올바른 값을 입력하면 다시 계산합니다.':'';
            for(const input of form.elements)if(input.validity)input.setAttribute('aria-invalid',String(!input.validity.valid));
            window.GuidebookPage.notifyHeight?.();
        });
    });
});
