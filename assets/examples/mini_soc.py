"""Instruction-level teaching SoC. This is a small custom ISA, not RISC-V.

Run: python mini_soc.py [--fault]
The CPU executes ROM instructions, accesses SRAM/MMIO, transmits a UART byte,
runs a DMA copy and observes/clears its IRQ. No cycle-accurate timing is claimed.
"""
import argparse
import json


class MiniSoC:
    SRAM_BASE=0x20000000
    DMA_BASE=0x40001000
    UART_DATA=0x40000000

    def __init__(self, fault=False):
        self.memory={}
        self.registers={}
        self.accumulator=0
        self.irq=False
        self.uart=[]
        self.trace=[]
        self.fault=fault

    def write(self,address,value):
        if self.SRAM_BASE<=address<self.SRAM_BASE+0x2000:
            self.memory[address]=value&255
        elif address==self.UART_DATA:
            self.uart.append(value&255)
        elif self.DMA_BASE<=address<self.DMA_BASE+0x14:
            offset=address-self.DMA_BASE
            if offset==0x10:
                self.registers[offset]=self.registers.get(offset,0)&~value
                self.irq=bool(self.registers[offset]&3)
            else:
                self.registers[offset]=value
                if offset==0 and value&1:
                    source,destination,length=(self.registers[x] for x in (4,8,12))
                    if self.fault:
                        self.registers[0x10]=2
                    else:
                        copied=[self.read(source+i) for i in range(length)]
                        for i,byte in enumerate(copied):self.write(destination+i,byte)
                        self.registers[0x10]=1
                    self.irq=True
        else:
            raise ValueError(f'Unmapped write 0x{address:08X}')

    def read(self,address):
        if self.SRAM_BASE<=address<self.SRAM_BASE+0x2000:
            return self.memory.get(address,0)
        if self.DMA_BASE<=address<self.DMA_BASE+0x14:
            return self.registers.get(address-self.DMA_BASE,0)
        raise ValueError(f'Unmapped read 0x{address:08X}')

    def execute(self,program):
        for pc,(operation,*args) in enumerate(program):
            if operation=='STORE':self.write(*args)
            elif operation=='LOAD':self.accumulator=self.read(*args)
            elif operation=='CHECK':
                if self.accumulator!=args[0]:raise AssertionError(f'PC {pc}: expected {args[0]}, got {self.accumulator}')
            elif operation=='IRQ':
                if not self.irq:raise AssertionError(f'PC {pc}: IRQ missing')
            elif operation=='HALT':break
            else:raise ValueError(operation)
            self.trace.append(dict(pc=pc,operation=operation,args=args,accumulator=self.accumulator,irq=int(self.irq)))
        return self.trace


def boot(fault=False):
    soc=MiniSoC(fault)
    source,destination=soc.SRAM_BASE,soc.SRAM_BASE+0x1000
    program=[('STORE',source+i,i) for i in range(32)]
    program += [('LOAD',source+7),('CHECK',7),('STORE',soc.UART_DATA,ord('O')),
                ('STORE',soc.UART_DATA,ord('K')),
                ('STORE',soc.DMA_BASE+4,source),('STORE',soc.DMA_BASE+8,destination),
                ('STORE',soc.DMA_BASE+12,32),('STORE',soc.DMA_BASE,1),('IRQ',),
                ('LOAD',soc.DMA_BASE+16),('CHECK',2 if fault else 1)]
    if not fault:
        program += [('LOAD',destination+31),('CHECK',31)]
    program += [('STORE',soc.DMA_BASE+16,3),('HALT',)]
    soc.execute(program)
    assert not soc.irq
    return dict(isa='ChipBook teaching ISA',uart=bytes(soc.uart).decode(),
                status='ERROR_HANDLED' if fault else 'PASS',
                destination=[soc.memory.get(destination+i,0) for i in range(32)],trace=soc.trace)


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--fault',action='store_true')
    args=parser.parse_args()
    print(json.dumps(boot(args.fault),indent=2))
