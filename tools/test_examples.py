import importlib.util
import random
import unittest
from site_common import REPO_ROOT

spec=importlib.util.spec_from_file_location('chipbook_reference',REPO_ROOT/'assets/examples/reference.py')
reference=importlib.util.module_from_spec(spec);spec.loader.exec_module(reference)


class ExampleContracts(unittest.TestCase):
    def test_soc_rom_executes_memory_uart_dma_and_irq_paths(self):
        spec=importlib.util.spec_from_file_location('mini_soc',REPO_ROOT/'assets/examples/mini_soc.py')
        module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
        normal=module.boot();error=module.boot(True)
        self.assertEqual(normal['uart'],'OK')
        self.assertEqual(normal['destination'],list(range(32)))
        self.assertEqual(normal['status'],'PASS')
        self.assertEqual(error['status'],'ERROR_HANDLED')
        self.assertEqual(normal['trace'][-1]['irq'],0)
        self.assertEqual(error['trace'][-1]['irq'],0)
    def test_stalled_array_matches_independent_scalar_for_signed_inputs(self):
        rng=random.Random(20261018)
        for n in (2,3,4):
            for _ in range(20):
                a=[[rng.randrange(-128,128) for _ in range(n)] for _ in range(n)]
                b=[[rng.randrange(-128,128) for _ in range(n)] for _ in range(n)]
                expected=reference.gemm(a,b)
                result=reference.systolic(a,b,stall_cycles=(0,2,4,6))
                self.assertEqual(result['output'],expected)
                self.assertEqual(sum(len(row['active']) for row in result['trace']),n**3)

    def test_dma_fifo_preserves_bytes_under_periodic_backpressure(self):
        for length in (1,3,4,18,32,129):
            data=list(range(length));result=reference.transfer(data,ready_pattern=(False,False,True))
            self.assertEqual(result['status'],'DONE')
            self.assertEqual(result['received'],data)
            self.assertLessEqual(max(r['occupancy'] for r in result['trace']),4)


if __name__=='__main__':unittest.main()
