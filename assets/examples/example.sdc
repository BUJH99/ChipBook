# Teaching-only 100 MHz clock and external-delay budget.
# Replace IO delay assumptions with the board and interface specification.
create_clock -name CoreClk -period 10.000 [get_ports iClk]
set_clock_uncertainty 0.100 [get_clocks CoreClk]
set_input_delay -clock CoreClk -max 2.000 [get_ports {iStart iLength* iErr iValid iData* iReady}]
set_input_delay -clock CoreClk -min 0.200 [get_ports {iStart iLength* iErr iValid iData* iReady}]
set_output_delay -clock CoreClk -max 2.000 [get_ports {oReady oValid oData* oBusy oDone oErr}]
set_output_delay -clock CoreClk -min 0.200 [get_ports {oReady oValid oData* oBusy oDone oErr}]
# iRstn is an asynchronous reset; add recovery/removal and RDC policy for the chosen implementation.
