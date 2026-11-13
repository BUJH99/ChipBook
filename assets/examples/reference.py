"""ChipBook runnable reference experiments. Python 3.10+, standard library only.

Run: python reference.py --project all
These are functional models, not RTL/electrical simulators.
"""
from __future__ import annotations
import argparse
import json
from collections import deque


def uart(byte: int) -> list[int]:
    return [0] + [(byte >> bit) & 1 for bit in range(8)] + [1]


def spi(byte: int, mode: int = 0) -> list[dict]:
    return [dict(bit=7-index, value=(byte >> (7-index)) & 1,
                 sample_edge='trailing' if mode & 1 else 'leading', idle=mode >> 1)
            for index in range(8)]


def register(previous: int, value: int, strobe: int = 15, access: str = 'RW') -> int:
    mask = sum(255 << (8*i) for i in range(4) if strobe & (1 << i))
    if access == 'RO':
        return previous
    if access == 'W1C':
        return previous & ~(value & mask)
    return ((previous & ~mask) | (value & mask)) & 0xffffffff


def transfer(data: list[int], depth: int = 4, ready_pattern=(True, False, True), error_at=-1):
    queue, received, trace = deque(), [], []
    accepted, cycle = 0, 0
    while accepted < len(data) or queue:
        if cycle == error_at:
            return dict(status='ERROR', accepted=accepted, received=received, trace=trace)
        ready = ready_pattern[cycle % len(ready_pattern)]
        pop = bool(queue) and ready
        push = accepted < len(data) and (len(queue) < depth or pop)
        if pop:
            received.append(queue.popleft())
        if push:
            queue.append(data[accepted]); accepted += 1
        trace.append(dict(cycle=cycle, push=push, pop=pop, occupancy=len(queue), accepted=accepted))
        cycle += 1
        if cycle > 10000:
            return dict(status='TIMEOUT', accepted=accepted, received=received, trace=trace)
    return dict(status='DONE', accepted=accepted, received=received, trace=trace)


def gemm(a, b):
    if not a or not b or len(a[0]) != len(b):
        raise ValueError('Incompatible matrix shapes')
    return [[sum(a[i][k]*b[k][j] for k in range(len(b)))
             for j in range(len(b[0]))] for i in range(len(a))]


def systolic(a, b, stall_cycles=()):
    rows, inner, columns = len(a), len(b), len(b[0])
    output = [[0]*columns for _ in range(rows)]
    trace, logical, physical = [], 0, 0
    while logical < rows + columns + inner - 2:
        active = []
        if physical not in stall_cycles:
            for i in range(rows):
                for j in range(columns):
                    k = logical-i-j
                    if 0 <= k < inner:
                        output[i][j] += a[i][k]*b[k][j]
                        active.append([i,j,k,output[i][j]])
            logical += 1
        trace.append(dict(cycle=physical, active=active, stalled=physical in stall_cycles))
        physical += 1
    return dict(output=output, trace=trace)


def experiments():
    a, b = [[1,2],[3,4]], [[5,6],[7,8]]
    npu = systolic(a,b,stall_cycles=(1,3))
    assert npu['output'] == gemm(a,b) == [[19,22],[43,50]]
    dma = transfer(list(range(32)))
    assert dma['received'] == list(range(32)) and dma['accepted'] == 32
    assert max(row['occupancy'] for row in dma['trace']) <= 4
    assert transfer(list(range(32)), error_at=3)['status'] == 'ERROR'
    assert register(0x11223344,0xaabbccdd,5) == 0x11bb33dd
    assert register(15,5,access='W1C') == 10
    for byte in range(256):
        assert sum(bit << i for i,bit in enumerate(uart(byte)[1:9])) == byte
    return {
        'peripheral': {'uart_0xA5':uart(0xa5),'spi_0xA6':spi(0xa6)},
        'register': {'byte_strobe':'0x11BB33DD','w1c':10},
        'dma':dma,
        'soc':{'register_base':'0x40001000','source':0x20000000,'destination':0x20001000,
               'length':32,'status':dma['status'],'irq':1},
        'npu':npu,
        'implementation':{'clock_period_ns':10,'arrival_ns':6.5,'required_ns':9.7,'setup_slack_ns':3.2},
    }


if __name__ == '__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--project',choices=['all','peripheral','register','dma','soc','npu','implementation'],default='all')
    args=parser.parse_args()
    results=experiments()
    print(json.dumps(results if args.project=='all' else results[args.project],indent=2))
