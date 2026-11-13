"""Run the downloadable examples from their extracted directory.

python run_examples.py reference
python run_examples.py lint       # pip install pyslang==12.0.0
python run_examples.py simulate   # Verilator with timing support on PATH
"""
import argparse
import shutil
import subprocess
import sys
from pathlib import Path

ROOT=Path(__file__).resolve().parent


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action',choices=['reference','lint','simulate'])
    parser.add_argument('--output',type=Path,default=ROOT/'.artifacts')
    args=parser.parse_args()
    if args.action=='reference':
        return subprocess.call([sys.executable,str(ROOT/'reference.py'),'--project','all'])
    sources=[str(path) for path in sorted((ROOT/'src').glob('*.sv'))]+[str(ROOT/'tb/TbTop.sv')]
    if args.action=='lint':
        try:
            import pyslang
        except ImportError:
            print('Install the optional compiler: python -m pip install pyslang==12.0.0',file=sys.stderr)
            return 2
        driver=pyslang.driver.Driver()
        driver.addStandardArgs()
        command=' '.join(['slang --timescale 1ns/1ps',f'-I"{ROOT / "tb"}"',*[f'"{path}"' for path in sources]])
        if not driver.parseCommandLine(command) or not driver.processOptions() or not driver.parseAllSources():
            return 1
        compilation=driver.createCompilation()
        driver.reportCompilation(compilation,False)
        return 0 if driver.reportDiagnostics(False) else 1
    executable=shutil.which('verilator')
    if not executable:
        print('Verilator is required for RTL execution. The reference and lint checks remain available.',file=sys.stderr)
        return 2
    output=args.output.resolve()
    output.mkdir(parents=True,exist_ok=True)
    subprocess.run([executable,'--binary','--timing','--trace','-Wno-fatal','--top-module','TbTop',
                    '-I'+str(ROOT/'tb'),'--Mdir',str(output/'obj'),*sources],check=True,cwd=output)
    binary=output/'obj'/('VTbTop.exe' if sys.platform=='win32' else 'VTbTop')
    return subprocess.call([str(binary)],cwd=output)


if __name__=='__main__':
    raise SystemExit(main())
