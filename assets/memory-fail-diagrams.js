/* Functional circuit diagrams for the synchronized memory-failure lessons.
 * The geometry is vector-native so signals, charge and node state remain inspectable.
 */
(function () {
    'use strict';
    const NS = 'http://www.w3.org/2000/svg';
    const BLUE = '#2563eb';
    const RED = '#f43f5e';
    const GREEN = '#0f9f78';
    const INK = '#27364f';
    const MUTED = '#94a3b8';
    const AMBER = '#ed8a20';
    function esc(value) {
        return String(value).replace(/[&<>"']/g, function (char) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
        });
    }
    function text(x, y, label, cls, attrs) {
        return '<text x="' + x + '" y="' + y + '" class="' + (cls || 'mf-svg-label') + '" ' + (attrs || '') + '>' + esc(label) + '</text>';
    }
    function path(d, cls, attrs) {
        return '<path d="' + d + '" class="' + (cls || 'mf-svg-wire') + '" ' + (attrs || '') + '/>';
    }
    function circle(x, y, r, cls, attrs) {
        return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" class="' + (cls || '') + '" ' + (attrs || '') + '/>';
    }
    function access(x, y, prefix) {
        const key = prefix || '';
        return '<g class="mf-access" data-access="' + key + '">' +
            path('M' + (x - 18) + ' ' + y + 'V' + (y - 10) + 'H' + (x + 18) + 'V' + y) +
            path('M' + (x - 18) + ' ' + (y - 16) + 'H' + (x + 18)) + '</g>';
    }
    function capacitor(x, y, prefix) {
        const key = prefix || '';
        return '<g data-capacitor="' + key + '">' +
            '<rect x="' + (x - 24) + '" y="' + (y - 30) + '" width="48" height="48" rx="14" class="mf-cap-halo"/>' +
            '<rect x="' + (x - 18) + '" y="' + (y - 25) + '" width="36" height="0" rx="8" data-charge-fill="' + key + '" fill="' + BLUE + '" opacity=".24"/>' +
            path('M' + x + ' ' + (y - 33) + 'V' + (y - 9) + 'M' + (x - 27) + ' ' + (y - 9) + 'H' + (x + 27) +
                'M' + (x - 27) + ' ' + (y + 3) + 'H' + (x + 27) + 'M' + x + ' ' + (y + 3) + 'V' + (y + 27)) +
            path('M' + (x - 18) + ' ' + (y + 27) + 'H' + (x + 18) + 'M' + (x - 12) + ' ' + (y + 34) + 'H' + (x + 12) +
                'M' + (x - 5) + ' ' + (y + 41) + 'H' + (x + 5)) +
            [0, 1, 2, 3, 4].map(function (i) { return circle(x - 14 + (i % 3) * 14, y - 17 - Math.floor(i / 3) * 13, 3.1, '', 'data-charge-dot="' + key + '" data-charge-level="' + (i + 1) + '" fill="' + BLUE + '"'); }).join('') +
            '</g>';
    }
    function flow(d, key, color) {
        return path(d, 'mf-flow-track', 'data-flow-path="' + key + '"') +
            circle(0, 0, 3.5, 'mf-flow-dot', 'data-flow-dot="' + key + '" opacity="0" fill="' + (color || BLUE) + '"');
    }
    function sramCore(prefix, transform) {
        const key = prefix || '';
        return '<g transform="' + (transform || '') + '" data-sram-core="' + key + '">' +
            text(66, 29, 'WL', 'mf-svg-label mf-svg-blue', 'data-wl-label="' + key + '"') +
            path('M65 44H535', 'mf-svg-wl', 'data-wl-line="' + key + '"') +
            path('M160 44V98M440 44V98', 'mf-svg-gate', 'data-wl-gates="' + key + '"') +
            path('M110 63V178M490 63V178', 'mf-svg-wire', 'data-bitlines="' + key + '"') +
            text(110, 205, 'BL', 'mf-svg-label', 'text-anchor="middle"') +
            text(490, 205, 'BLB', 'mf-svg-label', 'text-anchor="middle"') +
            text(110, 227, '1', 'mf-svg-value', 'text-anchor="middle" data-bl-value="' + key + '"') +
            text(490, 227, '1', 'mf-svg-value', 'text-anchor="middle" data-blb-value="' + key + '"') +
            path('M110 114H142M178 114H230M370 114H422M458 114H490') +
            access(160, 114, key + 'left') + access(440, 114, key + 'right') +
            path('M230 114V82H270', 'mf-svg-wire', 'data-feedback="' + key + '"') +
            '<polygon points="270,65 270,99 305,82" class="mf-svg-inverter"/>' +
            circle(312, 82, 5.2, 'mf-svg-inverter') +
            path('M318 82H370V114', 'mf-svg-wire', 'data-feedback="' + key + '"') +
            path('M370 114V164H330', 'mf-svg-wire', 'data-feedback="' + key + '"') +
            '<polygon points="330,147 330,181 295,164" class="mf-svg-inverter"/>' +
            circle(288, 164, 5.2, 'mf-svg-inverter') +
            path('M282 164H230V114', 'mf-svg-wire', 'data-feedback="' + key + '"') +
            circle(110, 114, 3.6, 'mf-junction') + circle(490, 114, 3.6, 'mf-junction') +
            circle(230, 114, 5, '', 'data-q-node="' + key + '" fill="' + BLUE + '"') +
            circle(370, 114, 5, '', 'data-qb-node="' + key + '" fill="' + RED + '"') +
            text(194, 144, 'Q', 'mf-svg-label') +
            text(393, 144, 'QB', 'mf-svg-label') +
            circle(228, 139, 13, '', 'data-q-bubble="' + key + '" fill="' + BLUE + '"') +
            circle(371, 139, 13, '', 'data-qb-bubble="' + key + '" fill="' + RED + '"') +
            text(228, 144, '0', 'mf-svg-bit', 'text-anchor="middle" data-q-text="' + key + '"') +
            text(371, 144, '1', 'mf-svg-bit', 'text-anchor="middle" data-qb-text="' + key + '"') +
            text(300, 219, '6T 셀 · 래치 등가도', 'mf-svg-subtle', 'text-anchor="middle"') +
            '<g data-bl-discharge="' + key + '">' +
            path('M110 140V179', 'mf-read-arrow') + '<path d="M104 174L110 184L116 174Z" fill="#79a9ff"/>' + '</g>' +
            '<g data-blb-discharge="' + key + '">' +
            path('M490 140V179', 'mf-read-arrow') + '<path d="M484 174L490 184L496 174Z" fill="#79a9ff"/>' + '</g>' +
            flow('M65 44H535', key + 'wl') +
            flow('M110 68V114H230', key + 'read-left') +
            flow('M490 68V114H370', key + 'read-right') +
            flow('M230 114V82H370V164H230V114', key + 'feedback', RED) +
            '</g>';
    }
    function trapInset(kind) {
        const aging = kind === 'aging';
        return '<g class="mf-trap-inset">' +
            '<rect x="443" y="50" width="137" height="146" rx="14" class="mf-svg-inset"/>' +
            text(511, 75, aging ? '소자 특성 이동' : '트랩 상태', 'mf-svg-label', 'text-anchor="middle"') +
            path('M462 151H561M480 135V156M543 135V156', 'mf-svg-wire') +
            '<rect x="479" y="109" width="65" height="18" rx="3" fill="#e5edf9" stroke="#aab9d0"/>' +
            '<rect x="489" y="97" width="45" height="8" rx="2" fill="#cedaf0"/>' +
            circle(512, 118, 8, 'mf-trap-orbit') +
            circle(512, 118, 4.8, '', 'data-trap-electron fill="' + RED + '"') +
            text(511, 177, aging ? 'ΔVth · 구동 변화' : '비어 있음', 'mf-svg-small', 'text-anchor="middle" data-trap-label') +
            path('M340 105L443 117', 'mf-svg-callout') + '</g>';
    }
    function sramDiagram(lesson) {
        const inset = lesson.diagram === 'trap-sram';
        let out = sramCore('', inset ? 'translate(0 22) scale(.75)' : 'translate(0 0)');
        out += '<g data-particle-group>' +
            path('M395 12L281 84L231 113', 'mf-particle-track') +
            circle(395, 12, 5.5, '', 'data-particle fill="' + AMBER + '"') +
            circle(230, 114, 24, 'mf-impact-ring', 'data-impact-ring') + '</g>';
        out += text(inset ? 200 : 300, inset ? 19 : 19, '', 'mf-svg-state', 'text-anchor="middle" data-supply-label');
        if (inset) out += trapInset(lesson.diagram);
        if (lesson.diagram === 'aging') out += '<g data-aging-callout>' +
            '<rect x="116" y="53" width="96" height="38" rx="8" fill="#fff0f3" stroke="#ffb8c8"/>' +
            text(164, 69, 'ΔVth 이동', 'mf-svg-small mf-svg-red', 'text-anchor="middle"') +
            text(164, 85, '구동 여유 ↓', 'mf-svg-small mf-svg-red', 'text-anchor="middle"') +
            path('M164 92V98', 'mf-svg-callout') + '</g>';
        return out;
    }
    function dramDiagram(lesson) {
        const kind = lesson.diagram;
        const withTrap = kind === 'trap-dram';
        let out = '<g>' +
            text(275, 52, 'WL (OFF)', 'mf-svg-label mf-svg-blue', 'text-anchor="middle" data-wl-label') +
            path('M275 69V98', 'mf-svg-wl', 'data-wl-line') +
            path('M164 44V195', 'mf-svg-wire') +
            text(143, 121, 'BL', 'mf-svg-label', 'text-anchor="end"') +
            path('M164 114H257M293 114H310M340 114H388V125') +
            path('M310 114H340', 'mf-svg-wire', 'data-storage-link') +
            '<g data-open-gap>' + path('M312 109L320 101M330 125L338 117', 'mf-svg-open') +
            text(325, 91, 'Open', 'mf-svg-red mf-svg-small', 'text-anchor="middle"') + '</g>' +
            access(275, 114) +
            capacitor(388, 158, '') +
            (withTrap ? '' : text(425, kind === 'refresh' ? 145 : 164, 'Ccell', 'mf-svg-label')) +
            text(388, 88, '저장 1', 'mf-svg-state', 'text-anchor="middle" data-charge-label') +
            (withTrap || kind === 'refresh' ? '' : text(435, 187, '전하 유지', 'mf-svg-small', 'data-charge-caption')) +
            text(300, 230, '1T1C · 전하 저장 셀', 'mf-svg-subtle', 'text-anchor="middle"') +
            circle(164, 114, 3.7, 'mf-junction') +
            flow('M275 69V98', 'wl') +
            flow('M164 176V114H388V136', 'charge') +
            flow('M388 169V210', 'leak', RED) +
            '<g data-dram-sense>' +
            '<rect x="94" y="162" width="140" height="42" rx="9" class="mf-svg-inset"/>' +
            text(164, 188, 'Sense Amp', 'mf-svg-small', 'text-anchor="middle" data-driver-label') + '</g>' +
            '<g data-pre-marker>' + path('M253 122L298 93', 'mf-svg-open') +
            text(276, 147, 'PRE', 'mf-svg-small mf-svg-red', 'text-anchor="middle"') + '</g>';
        out += '<g data-particle-group>' +
            path('M549 18L465 91L388 144', 'mf-particle-track') +
            circle(549, 18, 5.5, '', 'data-particle fill="' + AMBER + '"') +
            circle(388, 149, 26, 'mf-impact-ring', 'data-impact-ring') + '</g>';
        out += '<g data-spare-group>' +
            path('M164 130V202H253', 'mf-svg-remedy') +
            '<rect x="207" y="169" width="101" height="47" rx="9" class="mf-spare-cell"/>' +
            path('M227 180V188M218 188H236M218 194H236M227 194V203', 'mf-svg-remedy') +
            text(270, 189, 'Spare', 'mf-svg-small', 'text-anchor="middle"') +
            text(270, 207, '저장 1', 'mf-svg-small mf-svg-green', 'text-anchor="middle"') +
            flow('M164 130V202H218', 'spare', GREEN) + '</g>';
        if (withTrap) {
            out += trapInset('trap-dram');
        }
        if (kind === 'refresh') {
            out += '<g data-refresh-clock>' +
                '<circle cx="519" cy="109" r="36" class="mf-svg-inset"/>' +
                path('M519 84V109L535 118', 'mf-svg-wl', 'data-clock-hand') +
                text(519, 165, 'REF 일정', 'mf-svg-small', 'text-anchor="middle"') +
                text(519, 188, '대기', 'mf-svg-small', 'text-anchor="middle" data-clock-status') +
                path('M481 108H452L445 72H275', 'mf-svg-callout') + '</g>';
        }
        return out + '</g>';
    }
    function senseDiagram() {
        return [
            text(119, 27, 'BL', 'mf-svg-label', 'text-anchor="middle"'),
            text(218, 27, 'BLB', 'mf-svg-label', 'text-anchor="middle"'),
            path('M119 46V188M218 46V188', 'mf-svg-wire'),
            path('M119 105H308M218 143H308', 'mf-svg-wire'),
            '<rect x="75" y="55" width="57" height="28" rx="6" class="mf-svg-inset"/>',
            text(103, 74, '셀 1', 'mf-svg-small', 'text-anchor="middle"'),
            '<path d="M308 79L308 168L403 124Z" class="mf-svg-inverter"/>',
            text(325, 110, '+', 'mf-svg-label'),
            text(325, 148, '−', 'mf-svg-label'),
            text(347, 129, 'SA', 'mf-svg-label', 'text-anchor="middle"'),
            path('M404 124H512', 'mf-svg-wire', 'data-sense-output-line'),
            path('M355 50V80', 'mf-svg-wl', 'data-enable-line'),
            text(355, 36, 'SA Enable', 'mf-svg-blue mf-svg-small', 'text-anchor="middle"'),
            text(167, 220, 'ΔV = BL − BLB', 'mf-svg-subtle', 'text-anchor="middle"'),
            text(164, 167, '작은 차이', 'mf-svg-small', 'text-anchor="middle" data-diff-label'),
            '<circle cx="527" cy="124" r="21" fill="' + BLUE + '" data-output-bubble/>',
            text(527, 131, '?', 'mf-svg-bit', 'text-anchor="middle" data-output-value'),
            text(527, 166, 'DOUT', 'mf-svg-label', 'text-anchor="middle"'),
            text(365, 196, '', 'mf-svg-small mf-svg-red', 'text-anchor="middle" data-offset-label'),
            flow('M119 53V105H308', 'read-left'),
            flow('M218 53V143H308', 'read-right'),
            flow('M404 124H507', 'sense-output'),
            circle(119, 105, 3.6, 'mf-junction'),
            circle(218, 143, 3.6, 'mf-junction')
        ].join('');
    }
    function arrayCell(x, y, victim) {
        return '<g>' +
            path('M' + x + ' ' + (y - 22) + 'V' + (y + 5) + 'H' + (x + 9) +
                'M' + (x + 20) + ' ' + (y + 5) + 'H' + (x + 30) + 'V' + (y + 14), 'mf-array-cell-wire') +
            path('M' + (x + 10) + ' ' + (y + 5) + 'H' + (x + 19) + 'M' + (x + 10) + ' ' + (y + 1) + 'H' + (x + 19) +
                'M' + (x + 14.5) + ' ' + (y - 9) + 'V' + (y + 1), 'mf-array-cell-wire') +
            path('M' + (x + 22) + ' ' + (y + 14) + 'H' + (x + 38) + 'M' + (x + 22) + ' ' + (y + 20) + 'H' + (x + 38) +
                'M' + (x + 30) + ' ' + (y + 20) + 'V' + (y + 26), 'mf-array-cell-wire') +
            (victim ? circle(x + 30, y + 9, 4.2, '', (x === 309 ? 'data-victim-charge ' : 'opacity=".55" ') + 'fill="' + BLUE + '"') : '') +
            '</g>';
    }
    function rowhammerDiagram() {
        const rows = [{ y: 65, name: 'Aggressor A', sub: 'WL i−1' }, { y: 126, name: 'Victim', sub: 'WL i' }, { y: 187, name: 'Aggressor B', sub: 'WL i+1' }];
        let out = '<rect x="128" y="102" width="369" height="57" rx="11" class="mf-victim-row"/>';
        [171, 240, 309, 378, 447].forEach(function (x, i) {
            out += path('M' + x + ' 37V218', 'mf-array-bitline');
            out += text(x, 23, 'BL' + i, 'mf-svg-tiny', 'text-anchor="middle"');
        });
        rows.forEach(function (row, index) {
            const victim = index === 1;
            out += text(18, row.y - 2, row.name, victim ? 'mf-svg-label mf-svg-blue' : 'mf-svg-small');
            out += text(18, row.y + 19, row.sub, 'mf-svg-tiny');
            out += path('M139 ' + (row.y - 9) + 'H487', victim ? 'mf-svg-wl' : 'mf-aggressor-line', victim ? 'data-wl-line' : 'data-aggressor-line');
            [171, 240, 309, 378, 447].forEach(function (x) { out += arrayCell(x, row.y, victim); });
            if (!victim) out += flow('M139 ' + (row.y - 9) + 'H487', 'aggressor-' + index, AMBER);
        });
        out += '<rect x="327" y="106" width="55" height="47" rx="9" class="mf-victim-highlight"/>';
        out += text(550, 61, 'ACT', 'mf-svg-small mf-svg-orange', 'text-anchor="middle" data-act-a');
        out += text(550, 183, 'ACT', 'mf-svg-small mf-svg-orange', 'text-anchor="middle" data-act-b');
        out += '<circle cx="550" cy="123" r="24" data-q-bubble fill="' + BLUE + '"/>';
        out += text(550, 130, '1', 'mf-svg-bit', 'text-anchor="middle" data-q-text');
        out += text(550, 157, '저장값', 'mf-svg-tiny', 'text-anchor="middle"');
        out += text(310, 239, 'Victim WL OFF · 인접 행의 반복 활성화', 'mf-svg-subtle', 'text-anchor="middle" data-array-caption');
        return out;
    }
    function halfCell(prefix, x) {
        return '<g transform="translate(' + x + ' 0)">' +
            path('M69 70V98M231 70V98', 'mf-svg-gate', 'data-wl-gates') +
            path('M34 87V173M266 87V173M34 114H51M87 114H103M187 114H213M249 114H266') +
            access(69, 114, prefix + 'left') + access(231, 114, prefix + 'right') +
            path('M103 114V90H122M160 90H187V151H168M130 151H103V114', 'mf-svg-wire', 'data-feedback="' + prefix + '"') +
            '<polygon points="122,75 122,105 149,90" class="mf-svg-inverter"/>' + circle(154, 90, 4.5, 'mf-svg-inverter') +
            '<polygon points="168,136 168,166 141,151" class="mf-svg-inverter"/>' + circle(136, 151, 4.5, 'mf-svg-inverter') +
            circle(103, 114, 4, '', 'data-q-node="' + prefix + '" fill="' + BLUE + '"') +
            circle(187, 114, 4, '', 'data-qb-node="' + prefix + '" fill="' + RED + '"') +
            text(78, 188, 'Q', 'mf-svg-small', 'text-anchor="end"') +
            text(212, 188, 'QB', 'mf-svg-small') +
            circle(101, 183, 14, '', 'data-q-bubble="' + prefix + '" fill="' + BLUE + '"') +
            circle(189, 183, 14, '', 'data-qb-bubble="' + prefix + '" fill="' + RED + '"') +
            text(101, 189, '0', 'mf-svg-bit', 'text-anchor="middle" data-q-text="' + prefix + '"') +
            text(189, 189, '1', 'mf-svg-bit', 'text-anchor="middle" data-qb-text="' + prefix + '"') +
            flow('M34 87V114H103', prefix + 'read-left') +
            flow('M266 87V114H187', prefix + 'read-right') + '</g>';
    }
    function halfSelectDiagram() {
        return [
            '<rect x="307" y="43" width="280" height="186" rx="13" class="mf-victim-row"/>',
            text(147, 26, '쓰기 대상 열', 'mf-svg-label', 'text-anchor="middle"'),
            text(449, 26, 'Half-selected 열', 'mf-svg-label mf-svg-blue', 'text-anchor="middle"'),
            halfCell('target-', 0), halfCell('', 300),
            path('M34 70H566', 'mf-svg-wl', 'data-wl-line'),
            text(299, 57, '공통 WL', 'mf-svg-small mf-svg-blue', 'text-anchor="middle"'),
            text(147, 222, 'BL=1 / BLB=0', 'mf-svg-small', 'text-anchor="middle"'),
            text(449, 222, 'BL=1 / BLB=1', 'mf-svg-small mf-svg-blue', 'text-anchor="middle"'),
            text(300, 246, '쓰기 비선택 셀도 접근 트랜지스터가 켜짐', 'mf-svg-subtle', 'text-anchor="middle"')
        ].join('');
    }
    function slowDiagram() {
        return [
            '<rect x="34" y="77" width="109" height="104" rx="7" class="mf-svg-inset"/>',
            text(88, 102, 'SRAM', 'mf-svg-label', 'text-anchor="middle"'),
            text(88, 126, '저장 셀', 'mf-svg-label', 'text-anchor="middle"'),
            text(88, 155, 'Q = 1', 'mf-svg-label mf-svg-blue', 'text-anchor="middle"'),
            text(188, 46, 'BL', 'mf-svg-label', 'text-anchor="middle"'),
            text(346, 46, 'BLB', 'mf-svg-label', 'text-anchor="middle"'),
            path('M143 112H388M188 63V174', 'mf-svg-wire', 'data-read-path'),
            path('M143 147H388M346 63V174', 'mf-svg-wire', 'data-reference-path'),
            text(265, 94, '비트라인 · RC', 'mf-svg-small', 'text-anchor="middle"'),
            '<path d="M389 80L389 177L469 129Z" class="mf-svg-inverter"/>',
            text(398, 114, '+', 'mf-svg-small'), text(398, 153, '−', 'mf-svg-small'),
            text(424, 136, 'SA', 'mf-svg-small', 'text-anchor="middle"'),
            path('M469 129H523', 'mf-svg-wire', 'data-sense-output-line'),
            '<circle cx="545" cy="129" r="23" data-output-bubble fill="' + BLUE + '"/>',
            text(545, 136, '?', 'mf-svg-bit', 'text-anchor="middle" data-output-value'),
            text(545, 178, 'DOUT', 'mf-svg-label', 'text-anchor="middle"'),
            text(432, 22, '센싱 대기', 'mf-svg-small', 'text-anchor="middle" data-sample-label'),
            path('M432 32V105', 'mf-svg-gate', 'data-enable-line'),
            text(300, 231, '저장 Q=1 유지 · 비트라인 차이의 성장 비교', 'mf-svg-subtle', 'text-anchor="middle"'),
            '<rect x="272" y="185" width="143" height="8" rx="4" fill="#e3ebf8"/>',
            '<rect x="272" y="185" width="0" height="8" rx="4" fill="' + BLUE + '" data-signal-fill/>',
            flow('M143 112H388', 'read-path'), flow('M469 129H523', 'sense-output')
        ].join('');
    }
    function chooseMarkup(lesson) {
        if (lesson.diagram === 'sense') return senseDiagram();
        if (lesson.diagram === 'rowhammer') return rowhammerDiagram();
        if (lesson.diagram === 'half-select') return halfSelectDiagram();
        if (lesson.diagram === 'slow') return slowDiagram();
        if (lesson.diagram.indexOf('dram') >= 0 || lesson.diagram === 'refresh') return dramDiagram(lesson);
        return sramDiagram(lesson);
    }
    function create(lesson, container, side, uid) {
        const titleId = 'mf-circuit-title-' + uid;
        container.innerHTML = '<svg class="mf-diagram-svg" data-diagram="' + lesson.diagram + '" viewBox="0 0 600 254" role="img" aria-labelledby="' + titleId +
            '" xmlns="' + NS + '"><title id="' + titleId + '">' + esc(lesson.title + ' · ' + (side === 'normal' ? '정상 셀' : '취약 셀')) +
            '</title>' + chooseMarkup(lesson) + '</svg>';
        const svg = container.querySelector('svg');
        const all = function (selector) { return Array.from(svg.querySelectorAll(selector)); };
        const refs = new Map();
        function nodes(key) {
            if (!refs.has(key)) refs.set(key, all('[' + key + ']'));
            return refs.get(key);
        }
        function setText(key, value) {
            nodes(key).forEach(function (node) { if (node.textContent !== String(value)) node.textContent = value; });
        }
        function setAttr(key, name, value) {
            const next = String(value);
            nodes(key).forEach(function (node) {
                if (name === 'stroke' || name === 'stroke-width' || name === 'fill') {
                    if (node.style.getPropertyValue(name) !== next) node.style.setProperty(name, next);
                } else if (node.getAttribute(name) !== next) node.setAttribute(name, next);
            });
        }
        function show(key, visible) { setAttr(key, 'opacity', visible ? 1 : 0); }
        const flows = all('[data-flow-dot]').map(function (dot) {
            const key = dot.getAttribute('data-flow-dot');
            const line = svg.querySelector('[data-flow-path="' + key + '"]');
            const length = line.getTotalLength();
            const points = [];
            for (let i = 0; i <= 60; i += 1) {
                const point = line.getPointAtLength(length * i / 60);
                points.push([point.x, point.y]);
            }
            return { dot: dot, key: key, points: points };
        });
        function bitText(q) { return q < 0.36 ? '0' : q > 0.64 ? '1' : '?'; }
        function updateCore(prefix, q, qb, s) {
            [['q', q], ['qb', qb]].forEach(function (entry) {
                const which = entry[0], val = entry[1];
                const color = val > 0.64 ? RED : val < 0.36 ? BLUE : AMBER;
                all('[data-' + which + '-bubble="' + prefix + '"]').forEach(function (el) { el.setAttribute('fill', color); });
                all('[data-' + which + '-node="' + prefix + '"]').forEach(function (el) { el.setAttribute('fill', color); });
                all('[data-' + which + '-text="' + prefix + '"]').forEach(function (el) { const next = bitText(val); if (el.textContent !== next) el.textContent = next; });
            });
            all('[data-bl-value="' + prefix + '"]').forEach(function (el) { const next = s.bl > 0.9 ? '1' : s.bl < 0.1 ? '0' : '↓'; if (el.textContent !== next) el.textContent = next; });
            all('[data-blb-value="' + prefix + '"]').forEach(function (el) { const next = s.blb > 0.9 ? '1' : s.blb < 0.1 ? '0' : '↓'; if (el.textContent !== next) el.textContent = next; });
            all('[data-bl-discharge="' + prefix + '"]').forEach(function (el) { el.setAttribute('opacity', s.bl < 0.9 ? '1' : '0'); });
            all('[data-blb-discharge="' + prefix + '"]').forEach(function (el) { el.setAttribute('opacity', s.blb < 0.9 && s.blb > 0.1 ? '1' : '0'); });
        }
        function update(s, p, completeState) {
            const color = s.risk ? RED : s.protected ? GREEN : BLUE;
            const wlColor = s.wl > 0 ? BLUE : '#b8c9e8';
            setAttr('data-wl-line', 'stroke', wlColor);
            setAttr('data-wl-line', 'stroke-width', s.wl > 0 ? 4 : 2.6);
            setAttr('data-wl-gates', 'stroke', wlColor);
            setAttr('data-enable-line', 'stroke', s.sense ? BLUE : MUTED);
            setAttr('data-enable-line', 'stroke-width', s.sense ? 3.2 : 2);
            setText('data-wl-label', s.wl > 0 ? s.wl < 0.9 ? 'WL (LOWER)' : 'WL (ON)' : 'WL (OFF)');
            setAttr('data-access', 'stroke', s.wl > 0 ? BLUE : INK);
            updateCore('', s.q, s.qb, s);
            if (lesson.diagram === 'half-select') updateCore('target-', p < 0.58 ? Math.max(0, (p - 0.26) / 0.32) : 1, p < 0.58 ? 1 - Math.max(0, (p - 0.26) / 0.32) : 0, { bl: 1, blb: p < 0.2 ? 1 : 0 });
            if (lesson.diagram === 'slow') updateCore('source-', 1, 0, { bl: 1, blb: 1 });
            const physicalCharge = s.spare ? 0.12 : s.charge;
            nodes('data-charge-fill').forEach(function (el) {
                const height = physicalCharge * 42;
                el.setAttribute('height', String(height));
                el.setAttribute('y', String(176 - height));
                el.setAttribute('fill', s.defect ? RED : color);
            });
            nodes('data-charge-dot').forEach(function (el) {
                el.setAttribute('opacity', physicalCharge * 5 >= Number(el.dataset.chargeLevel) - 0.5 ? '1' : '.1');
                el.setAttribute('fill', s.defect ? RED : color);
            });
            setText('data-charge-label', s.spare ? '결함 셀 · 전하 부족' : s.bit === null ? '저장값 미확정' : '저장 ' + s.bit);
            setAttr('data-charge-label', 'fill', s.defect ? RED : color);
            setText('data-charge-caption', s.defect ? '결함 지속' : s.risk ? '전하 여유 부족' : s.drive ? '충전 중' : s.sense ? '복원 중' : '전하 여유 유지');
            setAttr('data-charge-caption', 'fill', color);
            nodes('data-feedback').forEach(function (el) {
                el.style.stroke = !el.getAttribute('data-feedback') && s.risk ? RED : INK;
            });
            setAttr('data-storage-link', 'opacity', s.defect ? 0 : 1);
            show('data-open-gap', s.defect);
            show('data-spare-group', s.spare);
            show('data-pre-marker', Boolean(s.pre));
            nodes('data-pre-marker').forEach(function (el) {
                el.querySelector('path').style.stroke = s.risk ? RED : BLUE;
                el.querySelector('text').style.fill = s.risk ? RED : BLUE;
            });
            const driverNeeded = lesson.id === 'dram-restore' || lesson.id === 'dram-write-recovery';
            show('data-dram-sense', driverNeeded);
            setText('data-driver-label', lesson.id === 'dram-write-recovery' ? 'Write Driver' : 'Sense Amp');
            setAttr('data-dram-sense', 'opacity', driverNeeded ? s.sense || s.drive ? 1 : 0.48 : 0);
            setText('data-clock-status', s.wl ? 'REF 수행' : s.risk ? '주기 초과' : side === 'vulnerable' && !s.protected && p > 0.27 ? 'REF 지연' : '일정 유지');
            setAttr('data-clock-status', 'fill', s.risk ? RED : INK);
            nodes('data-clock-hand').forEach(function (el) { el.setAttribute('transform', 'rotate(' + (p * 720) + ' 519 109)'); });
            show('data-trap-electron', Boolean(s.trap));
            setText('data-trap-label', s.trap ? '전자 포획' : '전자 방출');
            show('data-aging-callout', side === 'vulnerable' && p > 0.2);
            setText('data-supply-label', lesson.id === 'sram-hold' ? s.risk ? 'VDD ↓ · 보존 여유 소진' : s.protected ? 'VDD 보존 여유 확보' : '대기 VDD 비교' :
                lesson.id === 'sram-write-fail' ? s.protected ? 'WRITE ASSIST' : 'WRITE 1' :
                lesson.id === 'sram-aging' ? side === 'normal' ? 'Fresh · 초기 특성 기준' : 'Stressed · 누적 스트레스' :
                lesson.id === 'sram-ser' ? s.corrected ? 'ECC: DOUT=1 · 셀은 아직 0' : s.scrub ? 'SCRUB: 실제 셀 재기록' : '' : '');
            setAttr('data-aggressor-line', 'stroke', s.act ? AMBER : '#d6c5ad');
            setAttr('data-aggressor-line', 'stroke-width', s.act ? 3.7 : 2);
            setAttr('data-act-a', 'opacity', s.act ? 1 : 0.36);
            setAttr('data-act-b', 'opacity', s.act ? 1 : 0.36);
            setAttr('data-victim-charge', 'opacity', Math.max(0.14, s.charge));
            setAttr('data-victim-charge', 'fill', color);
            if (lesson.diagram === 'rowhammer') {
                setText('data-q-text', s.bit === null ? '?' : s.bit);
                setAttr('data-q-bubble', 'fill', color);
                svg.querySelector('.mf-victim-highlight').style.stroke = color;
            }
            setText('data-array-caption', s.wl ? 'Victim 행을 선제적으로 리프레시' : 'Victim WL OFF · 인접 행의 반복 활성화');
            const outputColor = s.output === null ? MUTED : s.risk && !s.corrected ? RED : s.protected ? GREEN : BLUE;
            setAttr('data-output-bubble', 'fill', outputColor);
            setText('data-output-value', s.output === null ? '?' : s.output);
            setAttr('data-sense-output-line', 'stroke', s.sense ? outputColor : INK);
            setText('data-offset-label', lesson.id === 'dram-sense' && side === 'vulnerable' ? s.protected ? '오프셋·노이즈 완화' : p > 0.4 ? '오프셋 > 입력 ΔV' : '작은 센싱 여유' : '');
            setText('data-sample-label', s.sense ? s.valid ? '센싱 · 신호 충분' : '센싱 · 신호 부족' : '센싱 대기');
            setAttr('data-sample-label', 'fill', s.risk ? RED : BLUE);
            setAttr('data-signal-fill', 'width', Math.max(0, s.metric * 143));
            setAttr('data-signal-fill', 'fill', color);
            setAttr('data-read-path', 'stroke', s.metric > 0.62 ? BLUE : '#92b7ef');
            setAttr('data-reference-path', 'stroke', '#ee879d');
            const particleActive = s.particle > 0.001;
            show('data-particle-group', particleActive);
            nodes('data-particle').forEach(function (el) {
                const t = Math.max(0, Math.min(1, (p - 0.25) / 0.16));
                const dram = lesson.family === 'DRAM';
                el.setAttribute('cx', String((dram ? 549 : 395) + ((dram ? 388 : 230) - (dram ? 549 : 395)) * t));
                el.setAttribute('cy', String((dram ? 18 : 12) + ((dram ? 149 : 114) - (dram ? 18 : 12)) * t));
            });
            setAttr('data-impact-ring', 'r', 10 + s.particle * 22);
            setAttr('data-impact-ring', 'opacity', s.particle * (side === 'normal' ? 0.35 : 1));
            flows.forEach(function (entry) {
                const key = entry.key;
                let active = false;
                if (key.indexOf('aggressor') === 0) active = s.act > 0;
                else if (key.indexOf('wl') >= 0) active = s.wl > 0;
                else if (key === 'charge') active = !s.defect && (s.drive > 0 || s.sense > 0 || s.wl > 0);
                else if (key === 'spare') active = s.spare && s.wl > 0;
                else if (key === 'leak') active = ['dram-retention', 'dram-vrt', 'dram-refresh'].includes(lesson.id) && p > 0.06 && p < 1;
                else if (key === 'sense-output') active = s.sense > 0 && p < 0.8;
                else if (key === 'read-path') active = p > 0.18 && p < 0.92;
                else if (key.indexOf('feedback') >= 0) active = s.wl > 0 || (s.risk && p < 0.8);
                else if (key.indexOf('read') >= 0) active = s.wl > 0 && (key.indexOf('right') < 0 || s.blb < 0.95 || lesson.id === 'dram-sense');
                entry.dot.setAttribute('opacity', active ? '1' : '0');
                if (!active) return;
                let fraction = (p * (key.indexOf('aggressor') >= 0 ? 15 : 6)) % 1;
                if (key === 'charge' && lesson.id === 'dram-restore' && p < 0.33) fraction = 1 - fraction;
                const pointIndex = Math.min(59, Math.floor(fraction * 60));
                const local = fraction * 60 - pointIndex;
                const a = entry.points[pointIndex], b = entry.points[pointIndex + 1];
                entry.dot.setAttribute('cx', String(a[0] + (b[0] - a[0]) * local));
                entry.dot.setAttribute('cy', String(a[1] + (b[1] - a[1]) * local));
                if (key.indexOf('aggressor') < 0) entry.dot.setAttribute('fill', key === 'spare' ? GREEN : key.indexOf('target-') === 0 ? BLUE : key === 'leak' ? RED : color);
            });
            const stateTitle = lesson.title + ' · ' + (side === 'normal' ? '정상 셀' : s.protected ? '개선 적용 셀' : '취약 셀') + ' · ' + s.status;
            const title = svg.querySelector('title');
            if (title.textContent !== stateTitle) title.textContent = stateTitle;
            svg.dataset.state = s.status;
            svg.dataset.bit = s.bit === null ? 'unknown' : String(s.bit);
            svg.dataset.output = s.output === null ? 'unknown' : String(s.output);
            svg.dataset.risk = String(s.risk);
            svg.dataset.progress = completeState.progress.toFixed(4);
        }
        return { svg: svg, update: update };
    }
    window.ChipBookFailureDiagrams = { create: create, escape: esc };
}());
