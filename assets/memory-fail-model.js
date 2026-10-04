/* ChipBook memory failure lessons.
 * Deterministic, normalized teaching examples, not a compact-device or SPICE model.
 * Circuit state, waveform samples, captions and readout all use the same sample().
 */
(function (root, factory) {
    'use strict';
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.ChipBookMemoryFailures = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const sources = {
        dram: { title: 'DRAM 신뢰성 · RowHammer와 보존 시간', url: 'https://people.inf.ethz.ch/omutlu/pub/rowhammer-and-other-memory-issues_date17.pdf' },
        trr: { title: 'TRR의 동작과 한계 · U-TRR', url: 'https://people.inf.ethz.ch/omutlu/pub/U-TRR-uncovering-RowHammer-protection-mechanisms_micro21.pdf' },
        sram: { title: 'SRAM의 읽기·쓰기·Half-select 마진', url: 'https://people.eecs.berkeley.edu/~bora/Conferences/2008/CICC08_Carlson.pdf' },
        ecc: { title: 'ECC 보정과 메모리 Scrubbing', url: 'https://community.infineon.com/t5/Knowledge-Base-Articles/ECC-Implementation-in-Cypress-s-65-nm-Asynchronous-SRAMs/ta-p/258180' },
        aging: { title: 'BTI와 SRAM의 정적·동적 안정성', url: 'https://research.ibm.com/publications/impacts-of-nbti-and-pbti-on-sram-staticdynamic-noise-margins-and-cell-failure-probability' },
        seu: { title: 'SEU · MCU · SER의 구분', url: 'https://community.infineon.com/t5/Knowledge-Base-Articles/Events-causing-Soft-Error-Rate-SER-in-Sync-SRAMs/ta-p/249595' }
    };

    const lessons = [
        {
            id: 'dram-retention', family: 'DRAM', title: '리텐션 불량', english: 'Retention Fail', category: 'Charge Leakage', diagram: 'dram',
            subtitle: '다음 리프레시 전에 전하가 부족해지는 과정을 비교합니다.',
            stimulus: 'WL / REF', metric: '셀 전하', threshold: 0.4, thresholdLabel: '판독 여유 경계',
            phases: ['전하 저장', '누설 시작', '전하 감소', '판독 여유 소진', '보존 결과'],
            notes: ['두 셀에 같은 데이터를 저장합니다. 전하는 논리 1의 예시입니다.', 'WL이 꺼져 있어도 누설 전류로 전하가 줄어듭니다.', '취약 셀은 같은 대기 시간 동안 더 많은 전하를 잃습니다.', '취약 셀의 전하가 판독 여유 경계를 넘는지 살펴보세요.', '리프레시는 데이터가 사라지기 전에 수행해야 합니다.'],
            cause: '셀 커패시터와 접근 트랜지스터의 누설 전류가 저장 전하를 소모합니다. 온도와 공정 조건에 따라 보존 시간이 달라집니다.',
            state: '정상 셀은 판독 여유를 유지합니다. 취약 셀은 다음 리프레시 전에 감지 가능한 전하 차이를 잃습니다.',
            result: '저장 상태를 안정적으로 판독할 수 없게 됩니다. 그림의 1 → 0은 가능한 오류의 한 예입니다.',
            mitigation: '리프레시 간격 단축', remedy: '취약 셀의 보존 시간과 온도 조건을 고려해, 전하 여유가 소진되기 전에 다시 충전합니다.',
            other: '누설 저감 · 온도 보상 · 보존 시간 검사', refs: ['dram']
        },
        {
            id: 'dram-restore', family: 'DRAM', title: '리스토어 페일', english: 'Restore Fail', category: 'Destructive Read', diagram: 'dram',
            subtitle: '읽기로 줄어든 전하를 충분히 복원한 뒤 행을 닫아야 합니다.',
            stimulus: 'WL', metric: '셀 전하', threshold: 0.84, thresholdLabel: '복원 목표',
            phases: ['저장 상태', '전하 공유', '센싱·복원', '행 닫기 / PRE', '복원 결과'],
            notes: ['DRAM 읽기는 셀과 비트라인의 전하 공유로 시작합니다.', '셀의 전하가 줄어들고 비트라인에 작은 차이가 생깁니다.', '센스 앰프가 판독값을 증폭하면서 셀 전하도 복원합니다.', '너무 이른 PRE는 복원이 끝나기 전에 접근 경로를 닫습니다.', '부분 복원은 당장 반전이 없어도 이후 보존 여유를 줄입니다.'],
            cause: '읽기 후 복원 시간이 부족하거나 센스 앰프 구동이 약하면 셀을 충분히 재충전하지 못합니다.',
            state: '정상 셀은 전하 공유 뒤 원래 수준으로 회복합니다. 취약 셀은 조기 PRE로 부분 복원 상태에 머뭅니다.',
            result: '저장 데이터가 즉시 반전된다는 뜻은 아닙니다. 남은 전하가 적어 다음 접근까지의 보존 여유가 줄어듭니다.',
            mitigation: 'tRAS 여유 확보', remedy: 'ACT 이후 센싱과 복원이 완료되도록 행 활성 시간을 확보한 뒤 PRE를 실행합니다.',
            other: '센스 앰프 구동력 · PVT 타이밍 검증', refs: ['dram']
        },
        {
            id: 'dram-sense', family: 'DRAM', title: '센스 앰프 마진 불량', english: 'Sense Margin', category: 'Offset / Noise', diagram: 'sense',
            subtitle: '작은 비트라인 차이와 센스 앰프의 오프셋이 판독 방향을 결정합니다.',
            stimulus: 'SA Enable', metric: 'SA 출력', threshold: 0.5, thresholdLabel: '판정 경계',
            phases: ['프리차지', '미세 ΔV 형성', '센스 앰프 활성', '증폭 방향 결정', '판독 결과'],
            notes: ['BL과 BLB는 같은 프리차지 상태에서 시작합니다.', '셀에 저장된 값이 두 비트라인 사이의 작은 ΔV를 만듭니다.', '입력 신호보다 큰 오프셋·노이즈는 잘못된 방향을 선택하게 할 수 있습니다.', '양의 피드백이 처음 선택한 방향을 빠르게 증폭합니다.', '이 예에서는 저장값은 같지만 판독 결과가 다릅니다.'],
            cause: '소자 미스매치와 결합 노이즈가 미세한 비트라인 신호보다 크면 센스 앰프의 판정 방향이 바뀔 수 있습니다.',
            state: '정상 경로는 작은 입력 차이를 올바르게 증폭합니다. 취약 경로는 반대 방향으로 증폭합니다.',
            result: '원래 저장한 1을 판독 회로가 0으로 해석합니다. 셀 보존 불량과 판독 불량을 구분해야 합니다.',
            mitigation: '오프셋·노이즈 완화', remedy: '대칭 배치, 충분한 센싱 여유와 오프셋 저감으로 유효 입력 차이를 확보합니다.',
            other: '비트라인 균형 · 센싱 시점 검증', refs: ['dram']
        },
        {
            id: 'dram-rowhammer', family: 'DRAM', title: '로우 해머링', english: 'Row Hammer', category: 'Disturbance', diagram: 'rowhammer',
            subtitle: '반복 활성화되는 인접 행과 선택되지 않은 Victim 행을 함께 봅니다.',
            stimulus: 'Aggressor ACT', metric: 'Victim 전하', threshold: 0.4, thresholdLabel: '판독 여유 경계',
            phases: ['초기 저장', '반복 ACT', '교란 누적', 'Victim 여유 감소', '비트 오류'],
            notes: ['인접한 두 Aggressor 행 사이에 Victim 행이 있습니다.', 'Aggressor 행을 반복적으로 열고 닫습니다. Victim의 WL은 OFF입니다.', '반복 접근에 의한 교란이 취약 셀의 전하 손실을 가속합니다.', '같은 접근 패턴에서 Victim의 전하 여유를 비교하세요.', '오류 발생 조건과 유효한 완화 방법은 DRAM·접근 패턴에 따라 달라집니다.'],
            cause: '인접 행의 반복적인 활성화가 선택되지 않은 셀에 교란을 누적시켜 전하 손실을 유발할 수 있습니다.',
            state: 'Aggressor의 ACT 펄스와 Victim 전하를 같은 시점에 표시합니다. Victim 행은 직접 선택되지 않습니다.',
            result: '충분한 교란이 누적된 취약 셀에서 데이터 오류가 발생합니다. 고정된 보편적 ACT 횟수는 가정하지 않습니다.',
            mitigation: '인접 행 리프레시', remedy: '피해 가능성이 있는 행을 조기에 리프레시해 전하 여유를 회복하는 개념을 비교합니다.',
            other: '접근 패턴 탐지 · 검증된 방어 조합', refs: ['dram', 'trr'],
            caveat: '이 비교는 원리를 보여줍니다. 일반적인 TRR이 모든 접근 패턴을 막는다는 의미는 아닙니다.'
        },
        {
            id: 'dram-refresh', family: 'DRAM', title: '리프레시 페일', english: 'Refresh Fail', category: 'Refresh Timing', diagram: 'refresh',
            subtitle: '리프레시가 늦거나 누락되면 약한 셀의 전하 여유가 먼저 사라집니다.',
            stimulus: 'REF', metric: '셀 전하', threshold: 0.4, thresholdLabel: '보존 경계',
            phases: ['정상 주기', 'REF 예정', 'REF 지연', '전하 여유 소진', '리프레시 결과'],
            notes: ['정상 경로는 정해진 일정에 맞춰 전하를 보충합니다.', '리프레시 일정은 셀의 보존 여유 안에 들어와야 합니다.', '취약 경로에서는 예정된 REF가 지연됩니다.', '늦게 도착한 리프레시는 이미 잘못된 값을 복원할 수 있습니다.', 'tREFI는 일정 간격, tRFC는 리프레시 동작에 필요한 시간입니다.'],
            cause: '리프레시 일정 누락·지연 또는 동작 시간 부족으로 셀 전하를 제때 보충하지 못합니다.',
            state: '정상 전하는 주기적으로 회복합니다. 지연된 셀은 다음 REF까지 계속 방전됩니다.',
            result: '보존 시간이 짧은 셀부터 데이터 오류가 생깁니다. 오류 뒤의 리프레시만으로 원래 값을 알 수는 없습니다.',
            mitigation: '리프레시 일정 보장', remedy: 'REF를 제때 발행하고 tRFC 동안 동작 완료 시간을 보장합니다. 여기서는 일정 지연을 비교합니다.',
            other: '온도별 정책 · 약한 셀 검사', refs: ['dram']
        },
        {
            id: 'dram-write-recovery', family: 'DRAM', title: '라이트 리커버리 페일', english: 'Write Recovery', category: 'Write Timing', diagram: 'dram',
            subtitle: '마지막 쓰기 데이터 뒤, 셀에 전하가 자리 잡을 시간을 확보합니다.',
            stimulus: 'WL', metric: '셀 전하', threshold: 0.84, thresholdLabel: '쓰기 목표',
            phases: ['쓰기 준비', '비트라인 구동', '셀 충전', 'tWR / PRE', '쓰기 결과'],
            notes: ['새 데이터 1을 쓰기 위해 비트라인을 준비합니다.', 'WL이 켜지면 Write Driver가 셀 커패시터를 충전합니다.', '외부 데이터 전송 종료와 내부 셀 충전 완료는 같은 순간이 아닙니다.', 'tWR를 확보하기 전에 PRE를 실행하면 충전이 중단될 수 있습니다.', '이 예의 취약 셀에는 새 데이터를 위한 전하가 충분히 남지 않습니다.'],
            cause: '쓰기 이후 필요한 회복 시간을 주지 않고 너무 일찍 프리차지하면 내부 충전이 완료되지 않을 수 있습니다.',
            state: '정상 경로는 목표 전하까지 충전한 뒤 WL을 끕니다. 취약 경로는 이른 PRE로 충전 경로가 닫힙니다.',
            result: '새 데이터를 안정적으로 저장하지 못합니다. 읽기 오류와 달리 쓰기 완료 시점의 셀 상태가 문제입니다.',
            mitigation: 'tWR 여유 확보', remedy: '마지막 쓰기 데이터 이후 PRE까지 필요한 회복 시간을 보장합니다.',
            other: 'Write Driver · 타이밍 마진 검증', refs: ['dram']
        },
        {
            id: 'dram-vrt', family: 'DRAM', title: '가변 보존 시간', english: 'Variable Retention Time', category: 'Trap / Leakage', diagram: 'trap-dram',
            subtitle: '같은 셀도 트랩 상태가 바뀌면 전하가 줄어드는 속도가 달라집니다.',
            stimulus: '누설 상태', metric: '셀 전하', threshold: 0.4, thresholdLabel: '보존 경계',
            phases: ['저누설 상태', '트랩 상태 변화', '고누설 상태', '보존 여유 감소', '간헐적 오류'],
            notes: ['같은 초기 전하에서 두 셀의 보존 상태를 비교합니다.', '트랩의 포획·방출에 따라 누설 경로가 달라질 수 있습니다.', '고누설 상태에서는 전하 곡선의 기울기가 더 가팔라집니다.', '한 번 측정한 긴 보존 시간만으로 최악 조건을 보장하기 어렵습니다.', '반복 검사와 보수적인 정책이 필요합니다. 이 파형은 하나의 학습용 예입니다.'],
            cause: '트랩 관련 상태 변화로 셀 누설이 여러 수준 사이를 이동하면서 보존 시간이 시간에 따라 바뀔 수 있습니다.',
            state: '누설 상태가 바뀌는 시점에 전하 감소 기울기도 바뀝니다. 상태 전이는 실제로 불규칙할 수 있습니다.',
            result: '검사 시점에는 정상이어도 다른 누설 상태에서는 보존 오류가 나타날 수 있습니다.',
            mitigation: '보수적 리프레시', remedy: '짧은 보존 상태도 고려한 정책과 반복적인 보존 시간 평가로 간헐 오류 위험을 줄입니다.',
            other: '반복 프로파일링 · ECC · 온도 조건 평가', refs: ['dram'],
            caveat: '한 번의 Burn-in이나 보존 시간 검사로 모든 VRT 셀을 검출한다고 가정하지 않습니다.'
        },
        {
            id: 'dram-hard-soft', family: 'DRAM', title: '하드·소프트 에러', english: 'Hard / Soft Error', category: 'Permanent / Transient', diagram: 'dram-error',
            subtitle: '물리적 결함과 일시적인 데이터 오류를 재기록 결과로 구분합니다.',
            stimulus: '재기록', metric: '셀 전하', threshold: 0.4, thresholdLabel: '판독 경계',
            phases: ['정상 저장', '결함 발생', '상태 확인', '재기록 시험', '복구 여부'],
            notes: ['같은 데이터가 저장된 두 셀에서 시작합니다.', 'Hard는 물리적 경로 결함, Soft는 회로가 유지되는 일시적 데이터 변화입니다.', '현재 저장 상태와 판독 결과를 비교합니다.', '올바른 값을 다시 써서 오류가 반복되는지 확인합니다.', 'Hard 결함은 재기록해도 남습니다. Soft 데이터 오류는 올바른 재기록으로 회복할 수 있습니다.'],
            cause: 'Hard 오류는 단선·단락 같은 지속적인 결함입니다. Soft 오류는 입자 사건 등으로 데이터만 변한 경우입니다.',
            state: 'Hard 모드에서는 저장 경로가 열린 채 남습니다. Soft 모드에서는 회로 연결을 유지한 채 전하만 달라집니다.',
            result: '재기록 뒤에도 반복되는 오류와, 올바른 재기록으로 회복되는 오류를 구분해 진단합니다.',
            mitigation: '예비 셀 치환', remedy: 'Hard 모드에서는 손상된 셀을 예비 셀로 대체합니다. 원래 결함 자체가 사라지는 것은 아닙니다.',
            other: '결함 검사 · ECC · Scrubbing', refs: ['dram', 'ecc']
        },
        {
            id: 'sram-read-upset', family: 'SRAM', title: '읽기 오류', english: 'Read Upset', category: 'Read Destructive', diagram: 'sram',
            subtitle: '읽기 동작 중 비트라인의 영향으로 셀의 저장 상태가 반전되는 현상',
            stimulus: 'WL', metric: 'Q', threshold: 0.46, thresholdLabel: '트립 포인트',
            phases: ['대기 · WL OFF', '읽기 경로 활성', '읽기 · WL ON', '래치 상태 결정', '읽기 완료'],
            notes: ['Q=0, QB=1인 두 셀에서 시작합니다.', 'BL과 BLB를 프리차지한 뒤 읽기 경로를 엽니다.', '저장된 0 노드가 올라갑니다. 정상 셀은 트립 포인트 아래에 머뭅니다.', '취약 셀은 경계를 넘어 피드백 방향이 바뀌고 래치가 반전됩니다.', 'WL이 꺼진 뒤에도 반전된 저장 상태가 남습니다.'],
            cause: 'WL이 켜지면 프리차지된 비트라인이 저장된 0 노드를 끌어올립니다. 셀의 복원력이 약하면 읽기 안정성이 부족해집니다.',
            state: '정상 셀  Q: 0 → 소폭 상승 → 0\n취약 셀  Q: 0 → 트립 포인트 초과 → 1',
            result: '저장 데이터가 0/1에서 1/0으로 바뀝니다. 판독값만 틀린 경우와 달리 셀 상태 자체가 변합니다.',
            mitigation: 'WL Underdrive', remedy: '접근 트랜지스터의 구동을 낮춰 읽기 중 0 노드가 들리는 정도를 줄이는 개념을 비교합니다.',
            other: '읽기 경로 분리 · Cell Ratio · PVT 검증', refs: ['sram'],
            caveat: 'WL을 낮추면 속도·쓰기 여유와의 절충이 생깁니다. 이 비교는 읽기 안정성에 집중합니다.'
        },
        {
            id: 'sram-write-fail', family: 'SRAM', title: '쓰기 실패', english: 'Write Fail', category: 'Write Margin', diagram: 'sram',
            subtitle: '새 데이터를 쓰는 힘이 기존 래치 상태를 뒤집을 만큼 충분해야 합니다.',
            stimulus: 'WL', metric: 'Q', threshold: 0.46, thresholdLabel: '트립 포인트',
            phases: ['기존 값 Q=0', 'BL=1 · BLB=0', '래치 전환', '전환 여유 비교', '쓰기 확인'],
            notes: ['기존 데이터 Q=0을 새 데이터 Q=1로 바꾸려 합니다.', '쓰기 비트라인을 서로 반대 값으로 구동합니다.', '정상 셀은 기존 피드백을 이기고 트립 포인트를 넘습니다.', '취약 셀은 전환하지 못한 채 WL이 꺼집니다.', '정상 셀에는 1, 실패한 셀에는 기존 0이 남습니다.'],
            cause: '쓰기 경로의 구동력이 셀의 기존 피드백을 이기지 못하거나 충분한 쓰기 시간이 없으면 상태가 전환되지 않습니다.',
            state: '정상 셀은 Q=1로 전환해 유지합니다. 취약 셀의 Q는 조금 올라가지만 WL이 꺼지면 기존 0으로 돌아갑니다.',
            result: '쓰기 명령을 실행했어도 새 데이터가 저장되지 않습니다. 읽기 안정성과 쓰기 용이성은 함께 검증해야 합니다.',
            mitigation: 'Write Assist', remedy: '쓰기 동안 셀 공급 전압이나 비트라인·워드라인 조건을 조절해 래치 전환 여유를 확보합니다.',
            other: '쓰기 펄스 폭 · Half-select 영향 검증', refs: ['sram']
        },
        {
            id: 'sram-half-select', family: 'SRAM', title: '하프 셀렉트 디스터브', english: 'Half-select Disturb', category: 'Array Level', diagram: 'half-select',
            subtitle: '같은 WL을 공유하는 옆 열의 셀도 쓰기 동작 중 영향을 받습니다.',
            stimulus: '공통 WL', metric: 'Victim Q', threshold: 0.46, thresholdLabel: '트립 포인트',
            phases: ['쓰기 준비', '공통 WL 활성', '옆 열 셀 교란', '취약 셀 반전', '보존 확인'],
            notes: ['왼쪽 열은 쓰기 대상이고 오른쪽 열은 쓰지 않는 셀입니다.', '한 행의 WL을 올리면 두 열의 접근 경로가 함께 열립니다.', 'Half-selected 셀은 BL/BLB가 모두 프리차지된 상태여서 읽기와 비슷한 교란을 받습니다.', '취약 셀의 0 노드가 경계를 넘으면 원치 않는 반전이 생길 수 있습니다.', '보호 설계는 쓰기 대상뿐 아니라 비선택 셀의 안정성도 만족해야 합니다.'],
            cause: '선택한 행의 비선택 열도 WL을 공유합니다. 두 비트라인이 프리차지된 셀에는 읽기와 유사한 교란이 걸립니다.',
            state: '쓰기 대상 셀은 정상적으로 전환합니다. 비교 대상은 같은 행 옆 열의 Half-selected 셀이며, 취약 조건에서만 반전됩니다.',
            result: '쓰지 않은 주소의 데이터가 바뀔 수 있습니다. 반복 접근·저전압 조건을 포함한 배열 수준 검증이 필요합니다.',
            mitigation: 'Half-select 보호', remedy: '비선택 셀의 WL·비트라인 조건과 Assist 방식을 함께 설계해 읽기 교란 수준을 제한합니다.',
            other: '배열 구조 · Assist 타이밍 · 코너 검증', refs: ['sram'],
            caveat: '일반적인 8T의 읽기 포트 분리만으로 모든 쓰기 Half-select 문제가 해결되지는 않습니다.'
        },
        {
            id: 'sram-hold', family: 'SRAM', title: '대기 전력 불량', english: 'Hold Fail', category: 'Retention Voltage', diagram: 'sram',
            subtitle: 'WL이 꺼진 대기 상태에서도 전압이 너무 낮으면 데이터를 잃습니다.',
            stimulus: '대기 VDD', metric: 'Q − QB', threshold: 0.25, thresholdLabel: '보존 여유 경계',
            phases: ['정상 보존', '대기 진입', 'VDD 감소', '복원력 소진', '상태 소실'],
            notes: ['WL은 계속 OFF입니다. 읽기·쓰기 교란이 없는 상태를 봅니다.', '대기 전력을 줄이기 위해 공급 전압을 낮춥니다.', '정상 셀은 래치 두 노드의 차이를 유지합니다.', '취약 셀은 내부 누설·미스매치를 이길 복원력이 부족해집니다.', '저장 상태를 보장할 수 없게 됩니다. 특정 0 또는 1로의 전환을 단정하지 않습니다.'],
            cause: '대기 VDD가 셀의 보존 요구 아래로 내려가면 피드백 래치가 내부 누설과 불균형을 이기지 못합니다.',
            state: '정상 셀은 Q와 QB를 구분할 수 있는 상태를 유지합니다. 취약 셀은 두 노드의 차이가 무너집니다.',
            result: '읽기나 쓰기를 하지 않아도 데이터가 소실될 수 있습니다. 여기서는 불확정 상태를 ?로 표시합니다.',
            mitigation: 'Retention VDD 확보', remedy: 'PVT와 셀 산포를 고려한 보존 전압 하한·Guardband를 확보해 대기 중 래치 안정성을 유지합니다.',
            other: 'Hold Assist · DRV 검사', refs: ['sram']
        },
        {
            id: 'sram-slow', family: 'SRAM', title: '슬로우 비트', english: 'Slow Bit', category: 'Read Timing', diagram: 'slow',
            subtitle: '저장 상태가 정상이어도 비트라인 신호가 센싱 시점에 늦을 수 있습니다.',
            stimulus: 'SA Enable', metric: 'BL − BLB 차이', threshold: 0.62, thresholdLabel: '센싱 필요 신호',
            phases: ['Read 시작', '비트라인 전개', '신호 차이 성장', '센싱 여유 비교', '판독 유효성'],
            notes: ['두 셀은 같은 데이터를 정상적으로 저장하고 있습니다.', 'WL이 켜지면 읽기 비트라인의 차이가 발달합니다.', '약한 구동력이나 큰 RC는 신호가 커지는 속도를 늦춥니다.', '같은 센싱 시점에서 충분한 신호가 있는지 비교합니다.', '늦게 신호가 커지더라도 이미 끝난 판독을 소급해 바꾸지는 않습니다.'],
            cause: '셀 구동력 저하, 배선 저항·용량 증가 또는 공정 산포로 읽기 신호가 늦게 전개됩니다.',
            state: '정상 신호는 센싱 시점 전에 충분히 커집니다. 느린 신호는 샘플링 순간에도 필요한 차이에 못 미칩니다.',
            result: '저장 래치는 정상이어도 판독값을 보장할 수 없습니다. 신호 도착 시간과 판독 시점을 함께 봐야 합니다.',
            mitigation: '센싱 시간 여유 확보', remedy: '읽기 주기의 여유를 늘려 느린 비트라인도 충분히 발달한 뒤 판독합니다.',
            other: 'RC 저감 · 구동력 · Speed Binning', refs: ['sram']
        },
        {
            id: 'sram-rtn', family: 'SRAM', title: '미스매치·RTN', english: 'Mismatch / RTN', category: 'Trap / Noise', diagram: 'trap-sram',
            subtitle: '고정된 소자 불균형 위에 불규칙한 트랩 변화가 더해집니다.',
            stimulus: '트랩 상태', metric: '안정성 여유', threshold: 0.25, thresholdLabel: '필요 여유',
            phases: ['초기 미스매치', '전자 포획', '문턱전압 변화', '마진 변화', '전자 방출'],
            notes: ['정적인 소자 미스매치가 래치의 기본 여유를 바꿉니다.', '개별 트랩이 전자를 포획하거나 방출할 수 있습니다.', '트랩 점유 상태에 따라 소자의 유효 문턱전압이 달라집니다.', '이미 여유가 작은 셀은 특정 트랩 상태에서 더 취약해집니다.', '이 예는 간헐적인 여유 감소를 보여줍니다. RTN이 항상 비트 반전을 뜻하지는 않습니다.'],
            cause: '공정 미스매치로 기울어진 셀 균형에 전자 포획·방출에 따른 문턱전압 변화가 겹칩니다.',
            state: '트랩의 두 상태를 오갈 때 취약 셀의 안정성 여유가 크게 흔들립니다. 파형은 재현 가능한 학습용 예입니다.',
            result: '특정 시점의 읽기·보존 오류 위험이 커집니다. 이 사례에서는 저장값을 유지하고 여유 부족을 강조합니다.',
            mitigation: '노이즈 마진 확보', remedy: '셀 설계와 동작 조건에서 미스매치·RTN 산포를 고려한 여유를 확보합니다.',
            other: '통계적 검증 · 저전압 코너 평가', refs: ['sram'],
            caveat: '소자 구조 변경만으로 모든 RTN이 사라진다고 가정하지 않습니다.'
        },
        {
            id: 'sram-aging', family: 'SRAM', title: '열화 불량', english: 'Aging', category: 'BTI / HCI', diagram: 'aging',
            subtitle: '누적된 동작 스트레스가 소자 특성과 동작 여유를 바꿉니다.',
            stimulus: '누적 스트레스', metric: '동작 여유', threshold: 0.3, thresholdLabel: '요구 여유',
            phases: ['초기 상태', '스트레스 누적', '소자 특성 이동', '구동 여유 감소', '수명 조건 비교'],
            notes: ['초기 셀의 동작 여유를 기준으로 비교합니다.', '전압·온도·활동 패턴에 따른 스트레스가 누적됩니다.', 'BTI·HCI 등의 효과가 소자 문턱전압과 구동 특성을 바꿀 수 있습니다.', '설계 조건에 따라 읽기 안정성, 쓰기 또는 타이밍 여유가 줄어듭니다.', '가로축은 누적 스트레스입니다. 재생 시간이나 실제 제품 수명과 같지 않습니다.'],
            cause: '장기간의 전압·온도·활동 스트레스로 소자 특성이 이동합니다. BTI와 HCI는 대표적인 열화 요인입니다.',
            state: '비교 셀의 동작 여유가 누적 스트레스에 따라 줄어드는 한 사례를 보여줍니다. 저장 비트를 직접 뒤집지는 않습니다.',
            result: '초기에 통과한 조건도 수명 말기에는 안정성·속도 요구를 만족하지 못할 수 있습니다.',
            mitigation: 'Aging Guardband', remedy: '수명 조건에서 필요한 여유를 초기 설계에 반영하고 열화 모델을 포함해 검증합니다.',
            other: '스트레스 조건 관리 · 수명 모델링', refs: ['aging']
        },
        {
            id: 'sram-ser', family: 'SRAM', title: '소프트 에러', english: 'Soft Error / SEU', category: 'Single Event Upset', diagram: 'sram',
            subtitle: '짧은 입자 사건이 지나가도 반전된 래치 상태는 남을 수 있습니다.',
            stimulus: '수집 전류', metric: 'Q', threshold: 0.46, thresholdLabel: '상태 전환 경계',
            phases: ['정상 보존', '입자 사건', '전하 수집 결과', '반전 상태 유지', '판독·재기록'],
            notes: ['Q=1을 보존하는 두 셀에서 시작합니다. WL은 OFF입니다.', '입자 사건이 저장 노드에 짧은 전류 펄스를 만들 수 있습니다.', '정상 셀은 교란에서 회복합니다. 취약 셀은 충분한 전하가 수집되면 반전됩니다.', '입자 펄스가 사라져도 잘못된 래치 상태는 남습니다.', 'ECC의 읽기 보정과 Scrub의 실제 재기록을 순서대로 구분해 보세요.'],
            cause: '고에너지 입자 사건으로 생긴 전하가 민감한 저장 노드에 수집되어 일시적인 전류 교란을 만듭니다.',
            state: '정상 셀은 원래 Q=1로 복귀합니다. 취약 셀은 Q=0으로 반전되고 사건이 끝난 뒤에도 그 값을 유지합니다.',
            result: '물리적 단선 없이 데이터만 변합니다. SEU는 사건이고 SER는 이런 오류의 발생률을 나타냅니다.',
            mitigation: 'ECC·Scrub 적용', remedy: '이 예의 단일 비트 오류는 ECC로 판독값을 먼저 보정하고, Scrub 재기록으로 저장 셀을 복구합니다.',
            other: '물리적 Interleaving · ECC 범위 검증', refs: ['seu', 'ecc'],
            caveat: 'ECC가 모든 다중 비트 오류를 보정하거나 입자 사건 자체를 막는 것은 아닙니다.'
        }
    ];

    const summaries = {
        'dram-retention': ['누설 전류가 저장 전하를 소모합니다. 취약 셀은 다음 리프레시 전에 판독 여유를 잃습니다.', '전하 차이가 감지 여유 아래로 떨어지면 저장값을 안정적으로 판독할 수 없습니다.'],
        'dram-restore': ['전하 공유로 줄어든 셀 전하를 복원하기 전에, 이른 PRE가 접근 경로를 닫습니다.', '부분 복원 상태로 남아 이후의 보존 여유가 줄어듭니다. 즉시 반전을 의미하지는 않습니다.'],
        'dram-sense': ['센스 앰프의 오프셋·노이즈가 BL/BLB의 작은 입력 차이보다 커집니다.', '저장값은 1이지만 판독 출력은 0이 됩니다. 셀 보존 오류와 판독 오류를 구분합니다.'],
        'dram-rowhammer': ['인접 행의 반복 ACT가 직접 선택되지 않은 Victim 셀에 교란을 누적시킵니다.', '취약 셀의 전하 여유가 소진되면 비트 오류가 생깁니다. 고정된 ACT 임계 횟수는 가정하지 않습니다.'],
        'dram-refresh': ['예정된 REF가 지연·누락되면 셀 전하를 제때 보충하지 못합니다.', '약한 셀부터 보존 오류가 생깁니다. 오류 뒤의 리프레시만으로 원래 값을 되찾지는 못합니다.'],
        'dram-write-recovery': ['쓰기 뒤 tWR를 확보하지 않고 PRE를 실행하면 내부 충전이 일찍 중단됩니다.', '새 데이터를 위한 전하가 충분히 남지 않습니다. 쓰기 완료 시점의 셀 상태가 문제입니다.'],
        'dram-vrt': ['트랩 상태에 따라 누설 수준이 달라져, 같은 셀의 보존 시간이 변합니다.', '한 번의 검사에서는 정상이어도 다른 누설 상태에서 간헐적인 보존 오류가 나타날 수 있습니다.'],
        'dram-hard-soft': ['Hard는 단선·단락 같은 물리적 결함, Soft는 회로 연결이 유지되는 데이터 변화입니다.', '올바른 재기록 후에도 반복되는 결함과, 재기록으로 회복되는 데이터 오류를 비교합니다.'],
        'sram-read-upset': ['프리차지된 BL이 0 노드를 끌어올립니다. 셀 복원력이 약하면 트립 포인트를 넘습니다.', 'Q/QB가 0/1 → 1/0으로 반전되어, WL이 꺼진 뒤에도 잘못된 저장 상태가 남습니다.'],
        'sram-write-fail': ['쓰기 구동이 기존 래치의 피드백을 이기지 못해 내부 노드가 충분히 전환되지 않습니다.', 'WL이 꺼지면 기존 값으로 돌아갑니다. 쓰기 명령을 실행해도 새 데이터는 저장되지 않습니다.'],
        'sram-half-select': ['같은 WL을 공유하는 비선택 열도 접근 경로가 열려, 읽기와 비슷한 교란을 받습니다.', '쓰지 않은 옆 열의 데이터가 바뀔 수 있습니다. 선택·비선택 셀의 여유를 함께 검증해야 합니다.'],
        'sram-hold': ['대기 VDD가 너무 낮으면 래치가 누설·불균형을 이길 복원력을 잃습니다.', 'WL이 꺼져 있어도 데이터를 잃을 수 있습니다. 보장할 수 없는 저장 상태를 ?로 표시합니다.'],
        'sram-slow': ['약한 구동력이나 큰 배선 RC 때문에 읽기 신호가 센싱 시점에 늦게 도착합니다.', '저장 래치는 정상이어도 판독값은 보장되지 않습니다. 늦게 커진 신호가 이전 판독을 고치지는 못합니다.'],
        'sram-rtn': ['고정된 소자 미스매치 위에 전자 포획·방출로 인한 문턱전압 변화가 더해집니다.', '특정 트랩 상태에서 읽기·보존 여유가 줄어듭니다. RTN이 항상 비트 반전을 뜻하지는 않습니다.'],
        'sram-aging': ['누적 스트레스가 소자 특성을 이동시켜 안정성·타이밍 여유를 줄일 수 있습니다.', '초기에 통과한 조건도 수명 말기에는 만족하지 못할 수 있습니다. 가로축은 누적 스트레스입니다.'],
        'sram-ser': ['입자 사건으로 수집된 전하가 저장 노드에 짧은 전류 교란을 만듭니다.', '펄스가 사라져도 반전된 래치는 남습니다. ECC 읽기 보정과 Scrub 재기록은 서로 다른 단계입니다.']
    };
    const previews = {
        'dram-retention': 0.78, 'dram-restore': 0.65, 'dram-sense': 0.74, 'dram-rowhammer': 0.75,
        'dram-refresh': 0.74, 'dram-write-recovery': 0.79, 'dram-vrt': 0.64, 'dram-hard-soft': 0.9,
        'sram-read-upset': 0.58, 'sram-write-fail': 0.73, 'sram-half-select': 0.74, 'sram-hold': 0.78,
        'sram-slow': 0.68, 'sram-rtn': 0.57, 'sram-aging': 0.88, 'sram-ser': 0.39
    };
    lessons.forEach(function (lesson) {
        lesson.shortCause = summaries[lesson.id][0];
        lesson.shortResult = summaries[lesson.id][1];
        lesson.preview = previews[lesson.id];
        lesson.plotMode = lesson.id === 'sram-read-upset' ? 'lanes' :
            ['dram-retention', 'sram-aging'].includes(lesson.id) ? 'overlay' : 'stimulus-overlay';
    });
    const byId = new Map(lessons.map(function (lesson) { return [lesson.id, lesson]; }));
    const phaseStops = [0, 0.25, 0.5, 0.75, 1];
    function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
    function ramp(p, a, b) { return clamp((p - a) / (b - a), 0, 1); }
    function smooth(p, a, b) { const x = ramp(p, a, b); return x * x * (3 - 2 * x); }
    function lerp(a, b, t) { return a + (b - a) * t; }
    function pulse(p, a, b) { return p >= a && p < b ? 1 : 0; }
    function curve(p, points) {
        if (p <= points[0][0]) return points[0][1];
        for (let i = 1; i < points.length; i += 1) {
            if (p <= points[i][0]) return lerp(points[i - 1][1], points[i][1], ramp(p, points[i - 1][0], points[i][0]));
        }
        return points[points.length - 1][1];
    }
    function phaseAt(p) { return p < 0.2 ? 0 : p < 0.4 ? 1 : p < 0.6 ? 2 : p < 0.85 ? 3 : 4; }
    function binary(q) { return q < 0.36 ? 0 : q > 0.64 ? 1 : null; }
    function signalState(value) { return value > 0.65 ? 'High' : value < 0.35 ? 'Low' : '전환 중'; }
    function chargeText(value) { return value > 0.78 ? '전하 충분' : value > 0.4 ? '전하 감소' : '전하 부족'; }
    function baseState() {
        return { q: 1, qb: 0, charge: 0.94, wl: 0, bl: 1, blb: 1, drive: 0, sense: 0, pre: false,
            trap: 0, act: 0, particle: 0, defect: false, spare: false, vdd: 1, margin: 0.8,
            bit: 1, output: null, valid: true, risk: false, corrected: false, scrub: false,
            metric: 0.94, status: '초기 상태', detail: '동일한 조건에서 비교', stimulus: 0 };
    }

    function sideState(id, p, vulnerable, mitigation, mode) {
        const s = baseState();
        const protectedSide = vulnerable && mitigation;
        const weak = vulnerable && !mitigation;
        if (id === 'dram-retention') {
            const cycle = p < 0.32 ? p : p < 0.64 ? p - 0.32 : p < 0.9 ? p - 0.64 : p - 0.9;
            s.charge = protectedSide ? 0.94 - 0.76 * cycle : 0.94 - (weak ? 0.82 : 0.28) * p;
            s.wl = protectedSide && (pulse(p, 0.32, 0.35) || pulse(p, 0.64, 0.67) || pulse(p, 0.9, 0.93)) ? 1 : 0;
            s.stimulus = s.wl;
            s.risk = s.charge < 0.4;
            s.bit = s.risk ? 0 : 1;
            s.status = s.risk ? '보존 여유 소진' : s.wl ? 'REF · 전하 보충' : '판독 여유 유지';
            s.detail = s.risk ? '다음 판독에서 오류 가능' : 'WL OFF에서도 누설 진행';
        } else if (id === 'dram-restore') {
            const preAt = weak ? 0.54 : 0.85;
            s.charge = curve(p, weak ? [[0, 0.94], [0.2, 0.94], [0.32, 0.48], [0.54, 0.64], [1, 0.52]]
                : [[0, 0.94], [0.2, 0.94], [0.32, 0.48], [0.8, 0.94], [1, 0.91]]);
            s.wl = pulse(p, 0.2, preAt);
            s.sense = pulse(p, 0.33, preAt);
            s.pre = p >= preAt;
            s.stimulus = s.wl;
            s.risk = weak && p >= preAt;
            s.status = s.risk ? '부분 복원 상태' : p > 0.8 ? '복원 완료' : p > 0.33 ? 'Sense Amp → 셀 복원' : p > 0.2 ? '전하 공유 중' : '저장값 1';
            s.detail = s.risk ? '조기 PRE · 보존 여유 감소' : s.pre ? '충분히 복원한 뒤 PRE' : '읽기로 감소한 전하를 복원';
        } else if (id === 'dram-sense') {
            s.sense = p >= 0.4 ? 1 : 0;
            s.wl = pulse(p, 0.22, 0.88);
            s.charge = 0.9;
            s.bl = p < 0.24 ? 0.5 : 0.56;
            s.blb = p < 0.24 ? 0.5 : 0.5;
            s.metric = lerp(0.5, weak ? 0.02 : 0.98, smooth(p, 0.42, 0.68));
            s.output = p < 0.65 ? null : weak ? 0 : 1;
            s.risk = weak && p > 0.48;
            s.stimulus = s.sense;
            s.status = p < 0.4 ? 'BL − BLB · 미세 ΔV' : p < 0.65 ? '판정 방향 증폭' : weak ? '저장 1 / 판독 0' : '저장 1 / 판독 1';
            s.detail = weak ? '오프셋·노이즈가 입력 차이를 압도' : '입력 차이를 올바르게 증폭';
        } else if (id === 'dram-rowhammer') {
            const activity = clamp((p - 0.18) / 0.66, 0, 1);
            const count = Math.floor(activity * 12);
            const frac = (activity * 12) % 1;
            s.act = p >= 0.18 && p < 0.84 && frac < 0.46 ? 1 : 0;
            s.wl = protectedSide && (pulse(p, 0.4, 0.435) || pulse(p, 0.62, 0.655) || pulse(p, 0.82, 0.855)) ? 1 : 0;
            s.charge = protectedSide ? 0.94 - (count % 4) * 0.06 : 0.94 - count * (weak ? 0.064 : 0.015);
            s.stimulus = s.act;
            s.risk = s.charge < 0.4;
            s.bit = s.risk ? 0 : 1;
            s.status = s.risk ? 'Victim · 1 → 0' : s.wl ? 'Victim 선제 리프레시' : p < 0.18 ? '초기 저장' : 'Victim 전하 여유 ' + (s.charge < 0.65 ? '감소' : '유지');
            s.detail = s.wl ? '피해 가능 행의 전하 보충' : 'Victim WL OFF · 인접 행 반복 ACT';
        } else if (id === 'dram-refresh') {
            const ref = !weak && (pulse(p, 0.27, 0.3) || pulse(p, 0.54, 0.57) || pulse(p, 0.81, 0.84));
            const elapsed = weak ? p : p < 0.27 ? p : p < 0.54 ? p - 0.27 : p < 0.81 ? p - 0.54 : p - 0.81;
            s.charge = 0.94 - elapsed * (weak ? 0.87 : 0.83);
            s.wl = ref ? 1 : 0;
            s.stimulus = s.wl;
            s.risk = s.charge < 0.4;
            s.bit = s.risk ? 0 : 1;
            s.status = ref ? 'REF 수행' : s.risk ? 'REF 이전 보존 실패' : weak && p > 0.27 ? '예정된 REF 지연' : '다음 REF까지 유지';
            s.detail = weak && p > 0.27 ? '리프레시 일정 누락 예시' : 'tREFI 일정 · tRFC 완료 시간';
        } else if (id === 'dram-write-recovery') {
            const preAt = weak ? 0.51 : 0.84;
            s.charge = curve(p, weak ? [[0, 0.06], [0.19, 0.06], [0.51, 0.58], [1, 0.48]]
                : [[0, 0.06], [0.19, 0.06], [0.76, 0.95], [1, 0.93]]);
            s.wl = pulse(p, 0.19, preAt);
            s.drive = pulse(p, 0.19, preAt);
            s.pre = p >= preAt;
            s.stimulus = s.wl;
            s.bit = s.charge > 0.84 ? 1 : p < 0.19 ? 0 : null;
            s.risk = weak && p >= preAt;
            s.status = s.risk ? '새 데이터 충전 부족' : p >= 0.84 ? '새 데이터 1 저장' : p >= 0.19 ? 'Write Driver → 셀 충전' : '기존 데이터 0';
            s.detail = s.risk ? 'tWR 부족 · 이른 PRE' : p >= 0.84 ? 'tWR 확보 후 PRE' : '셀 전하 안정화 대기';
        } else if (id === 'dram-vrt') {
            s.trap = vulnerable ? pulse(p, 0.27, 0.7) : 0;
            const raw = curve(p, weak ? [[0, 0.94], [0.27, 0.86], [0.7, 0.24], [1, 0.15]]
                : [[0, 0.94], [1, 0.69]]);
            const elapsed = p < 0.3 ? p : p < 0.56 ? p - 0.3 : p < 0.8 ? p - 0.56 : p - 0.8;
            s.charge = protectedSide ? 0.94 - elapsed * 1.2 : raw;
            s.wl = protectedSide && (pulse(p, 0.3, 0.33) || pulse(p, 0.56, 0.59) || pulse(p, 0.8, 0.83)) ? 1 : 0;
            s.stimulus = vulnerable ? s.trap ? 0.95 : 0.2 : 0.2;
            s.risk = s.charge < 0.4;
            s.bit = s.risk ? 0 : 1;
            s.status = s.risk ? '짧은 보존 상태에서 오류' : s.wl ? '보수적 REF 적용' : s.trap && vulnerable ? '고누설 상태' : '저누설 상태';
            s.detail = s.trap && vulnerable ? '트랩 상태 변화 · 전하 감소 가속' : '시간에 따라 달라지는 보존 특성';
        } else if (id === 'dram-hard-soft') {
            const soft = mode === 'soft';
            s.particle = soft ? Math.sin(Math.PI * ramp(p, 0.25, 0.4)) : 0;
            s.defect = !soft && vulnerable && p >= 0.3;
            s.spare = s.defect && mitigation && p >= 0.68;
            const upset = vulnerable && p >= 0.3;
            const rewritten = p >= 0.83 && (soft || s.spare || !vulnerable);
            s.charge = upset && !rewritten ? 0.12 : 0.94;
            s.wl = pulse(p, 0.68, 0.83);
            s.drive = s.wl;
            s.stimulus = s.wl;
            s.corrected = soft && protectedSide && p >= 0.59 && !rewritten;
            s.scrub = rewritten && soft && vulnerable;
            s.bit = s.charge > 0.4 ? 1 : 0;
            s.output = p >= 0.59 ? s.corrected ? 1 : s.bit : null;
            s.risk = upset && !rewritten;
            s.status = s.spare ? p >= 0.83 ? '예비 셀 · 저장 1' : '예비 셀로 재기록' : s.corrected ? '셀 0 / ECC 판독 1' : rewritten && vulnerable ? '재기록 후 데이터 복구' : s.defect ? p >= 0.83 ? '재기록해도 결함 지속' : '저장 경로 단선' : upset ? '회로 정상 · 데이터 변화' : '정상 저장 1';
            s.detail = s.spare ? '원래 결함은 남음 · 경로 치환' : soft ? '일시적 데이터 오류 · 연결 유지' : vulnerable && p >= 0.3 ? 'Hard 결함은 데이터 재기록으로 복구되지 않음' : '재기록 후 결과 확인';
        } else if (id === 'sram-read-upset') {
            s.wl = pulse(p, 0.22, 0.8) * (protectedSide ? 0.68 : 1);
            s.q = weak ? curve(p, [[0, 0], [0.22, 0], [0.42, 0.27], [0.51, 0.48], [0.63, 1], [1, 1]])
                : curve(p, [[0, 0], [0.22, 0], [0.42, protectedSide ? 0.16 : 0.23], [0.63, protectedSide ? 0.16 : 0.23], [0.84, 0], [1, 0]]);
            s.qb = 1 - s.q;
            s.bl = s.wl ? 1 - 0.55 * smooth(p, 0.23, 0.58) * (1 - s.q) : 1;
            s.blb = s.wl && weak && p >= 0.51 ? 1 - 0.6 * smooth(p, 0.51, 0.72) : 1;
            s.risk = weak && p >= 0.51;
            s.bit = binary(s.q);
            s.output = p > 0.75 ? s.bit : null;
            s.stimulus = s.wl;
            s.status = s.risk ? p < 0.63 ? '트립 포인트 초과' : '저장 상태 반전 · 1/0' : p > 0.84 ? '읽기 후 상태 유지 · 0/1' : s.wl ? 'Q 상승 · 상태 유지' : '저장 Q=0 / QB=1';
            s.detail = protectedSide ? 'WL Underdrive · 읽기 교란 완화' : s.risk ? '피드백 방향 전환' : '0 노드의 상승을 셀 복원력이 제한';
        } else if (id === 'sram-write-fail') {
            s.wl = pulse(p, 0.23, 0.82);
            s.drive = s.wl;
            s.bl = 1;
            s.blb = p < 0.2 || p >= 0.85 ? 1 : 0;
            s.q = weak ? curve(p, [[0, 0], [0.23, 0], [0.55, 0.32], [0.78, 0.32], [0.9, 0], [1, 0]])
                : smooth(p, 0.3, 0.64);
            s.qb = 1 - s.q;
            s.bit = binary(s.q);
            s.stimulus = s.wl;
            s.risk = weak && p >= 0.56;
            s.status = weak && p >= 0.85 ? '쓰기 실패 · 기존 0 유지' : !weak && p >= 0.65 ? '새 데이터 1 유지' : s.wl ? '새 데이터 1 쓰기' : p >= 0.85 ? '쓰기 결과 확인' : '기존 데이터 Q=0';
            s.detail = weak ? '기존 래치 복원력 > 쓰기 구동' : protectedSide ? 'Write Assist · 전환 여유 확보' : '트립 포인트를 넘어 래치 전환';
        } else if (id === 'sram-half-select') {
            s.wl = pulse(p, 0.24, 0.82);
            s.bl = 1;
            s.blb = 1;
            s.q = weak ? curve(p, [[0, 0], [0.24, 0], [0.48, 0.32], [0.57, 0.48], [0.68, 1], [1, 1]])
                : curve(p, [[0, 0], [0.24, 0], [0.5, protectedSide ? 0.17 : 0.23], [0.75, protectedSide ? 0.17 : 0.23], [0.88, 0], [1, 0]]);
            s.qb = 1 - s.q;
            s.bit = binary(s.q);
            s.risk = weak && p >= 0.57;
            s.stimulus = s.wl;
            s.status = s.risk ? '비선택 셀 Q · 0 → 1' : p >= 0.88 ? '비선택 셀 0 유지' : s.wl ? 'Half-select 교란 중' : '옆 열 셀 · 쓰기 비선택';
            s.detail = '쓰기 대상과 공통 WL · Victim BL/BLB=1/1';
        } else if (id === 'sram-hold') {
            s.vdd = 1 - (weak ? 0.84 : 0.36) * smooth(p, 0.2, 0.78);
            const separation = weak ? 1 - smooth(p, 0.43, 0.8) : 0.98 - 0.06 * p;
            s.q = 0.5 + separation / 2;
            s.qb = 1 - s.q;
            s.metric = separation;
            s.stimulus = s.vdd;
            s.bit = separation < 0.25 ? null : 1;
            s.risk = separation < 0.25;
            s.status = s.risk ? '저장 상태 보장 불가 · ?' : 'WL OFF · 상태 보존';
            s.detail = s.risk ? 'Q / QB 구분 여유 소실' : protectedSide ? '보존 VDD Guardband 확보' : '대기 중 래치 복원력 유지';
        } else if (id === 'sram-slow') {
            const senseAt = mitigation ? 0.87 : 0.62;
            s.wl = pulse(p, 0.16, 0.96);
            s.sense = p >= senseAt ? 1 : 0;
            s.metric = vulnerable ? 0.94 * ramp(p, 0.22, 1.06) : 0.94 * ramp(p, 0.18, 0.64);
            const sampledValue = vulnerable ? 0.94 * ramp(senseAt, 0.22, 1.06) : 0.94 * ramp(senseAt, 0.18, 0.64);
            s.valid = !s.sense || sampledValue >= 0.62;
            s.output = s.sense && s.valid ? 1 : null;
            s.risk = !s.valid;
            s.stimulus = s.sense;
            s.status = s.sense ? s.valid ? '센싱 시점 · 유효한 판독' : '센싱 시점 · 신호 부족' : '비트라인 신호 전개';
            s.detail = '저장 래치 Q=1 유지 · 판독 타이밍 비교';
        } else if (id === 'sram-rtn') {
            s.trap = pulse(p, 0.29, 0.43) || pulse(p, 0.48, 0.77);
            s.metric = vulnerable ? (mitigation ? 0.69 : 0.43) - (s.trap ? 0.31 : 0) : 0.76 - (s.trap ? 0.09 : 0);
            s.q = 0;
            s.qb = 1;
            s.bit = 0;
            s.risk = s.metric < 0.25;
            s.stimulus = s.trap ? 0.88 : 0.12;
            s.status = s.risk ? '트랩 점유 · 안정성 여유 부족' : p >= 0.77 && weak ? '방출 후 여유 회복' : s.trap ? '트랩 점유 · 여유 유지' : '초기 미스매치 여유';
            s.detail = '저장값 0 유지 · 간헐적인 오류 위험 비교';
        } else if (id === 'sram-aging') {
            s.age = p;
            s.metric = vulnerable ? (mitigation ? 0.97 : 0.8) - (mitigation ? 0.49 : 0.69) * smooth(p, 0.12, 1) : 0.8;
            s.q = 0; s.qb = 1; s.bit = 0;
            // The circuit depicts a read probe at each cumulative-stress point.
            s.wl = 1; s.bl = vulnerable ? 0.94 - 0.3 * s.metric : 0.56;
            s.stimulus = p;
            s.risk = s.metric < 0.3;
            s.status = !vulnerable ? 'Fresh · 초기 특성 기준' : s.risk ? '수명 조건 · 동작 여유 부족' : protectedSide ? '수명 조건 Guardband 유지' : p < 0.2 ? '초기 소자 상태' : '스트레스 누적 중';
            s.detail = '각 스트레스 조건의 읽기 평가 · 실제 제품 수명 값 아님';
        } else if (id === 'sram-ser') {
            s.particle = Math.sin(Math.PI * ramp(p, 0.25, 0.41));
            s.q = vulnerable ? 1 - smooth(p, 0.28, 0.45) : 1 - 0.28 * Math.sin(Math.PI * ramp(p, 0.26, 0.47));
            s.corrected = protectedSide && p >= 0.63 && p < 0.82;
            s.scrub = protectedSide && p >= 0.82;
            if (s.scrub) s.q = smooth(p, 0.82, 0.9);
            s.qb = 1 - s.q;
            s.wl = s.scrub && p < 0.9 ? 1 : 0;
            s.bit = binary(s.q);
            s.output = p < 0.63 ? null : protectedSide ? 1 : s.bit;
            s.risk = vulnerable && p >= 0.38 && p < (mitigation ? 0.9 : 2);
            s.stimulus = s.particle;
            s.status = s.corrected ? '셀 0 / ECC 판독 1' : s.scrub ? p < 0.9 ? 'Scrub · 셀 재기록' : '저장 셀 복구 · Q=1' : s.risk ? 'SEU · Q=0 유지' : p < 0.25 ? '정상 보존 · Q=1' : p < 0.47 ? '입자 사건 · 일시적 교란' : '교란 후 Q=1 복귀';
            s.detail = s.corrected ? '읽기 보정 완료 · 셀 재기록 전' : s.scrub ? '올바른 데이터를 실제 셀에 재기록' : '단선 없이 데이터만 변화';
        }
        const isCharge = id.indexOf('dram-') === 0 && id !== 'dram-sense';
        if (isCharge) {
            s.q = s.charge;
            s.qb = 1 - s.q;
            s.metric = s.charge;
        } else if (['sram-read-upset', 'sram-write-fail', 'sram-half-select', 'sram-ser'].includes(id)) s.metric = s.q;
        s.metric = clamp(s.metric, 0, 1);
        s.q = clamp(s.q, 0, 1);
        s.qb = clamp(s.qb, 0, 1);
        s.protected = protectedSide;
        return s;
    }

    function sample(id, progress, mitigation, mode) {
        const lesson = byId.get(id);
        if (!lesson) throw new RangeError('Unknown memory failure: ' + id);
        const p = clamp(Number.isFinite(progress) ? progress : 0, 0, 1);
        const chosenMode = mode === 'soft' ? 'soft' : 'hard';
        const normal = sideState(id, p, false, Boolean(mitigation), chosenMode);
        const vulnerable = sideState(id, p, true, Boolean(mitigation), chosenMode);
        return { id: id, progress: p, phase: phaseAt(p), mode: chosenMode, mitigation: Boolean(mitigation),
            normal: normal, vulnerable: vulnerable, stimulus: vulnerable.stimulus, threshold: lesson.threshold };
    }

    function waveforms(id, mitigation, mode, resolution) {
        const count = Number.isInteger(resolution) ? clamp(resolution, 20, 1000) : 240;
        const points = [];
        for (let i = 0; i <= count; i += 1) {
            const state = sample(id, i / count, mitigation, mode);
            points.push({ t: state.progress, stimulus: state.stimulus, normalStimulus: state.normal.stimulus, normal: state.normal.metric, vulnerable: state.vulnerable.metric });
        }
        return points;
    }

    function getLesson(id) { return byId.get(id); }
    return { lessons: lessons, sources: sources, phaseStops: phaseStops, getLesson: getLesson, sample: sample,
        waveforms: waveforms, phaseAt: phaseAt, signalState: signalState, clamp: clamp };
}));
