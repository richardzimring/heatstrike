import { useState } from 'react';
import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

export function InfoDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="About Heatstrike">
          <Info className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[50vh] overflow-y-auto">
        <div className="space-y-5 text-sm">
          {/* How it works */}
          <section>
            <h3 className="font-semibold mb-2">How It Works</h3>
            <p className="text-muted-foreground">
              Enter a stock ticker to fetch options data. The heatmap displays
              strike prices on the Y-axis and expiration dates on the X-axis,
              with color intensity representing the value of the selected
              metric.
            </p>
          </section>

          {/* Data scope */}
          <section>
            <h3 className="font-semibold mb-2">Data Filters</h3>
            <ul className="text-muted-foreground space-y-1.5 list-disc pl-5">
              <li>
                <span className="font-medium text-foreground">
                  Strike prices:
                </span>{' '}
                Only whole-dollar (integer) strikes within 5 strikes above and
                below the current stock price
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Expiration dates:
                </span>{' '}
                Limited to the next 8 available expiration dates
              </li>
            </ul>
          </section>

          {/* Caching */}
          <section>
            <h3 className="font-semibold mb-2">Caching</h3>
            <p className="text-muted-foreground">
              Options data for each ticker is cached for{' '}
              <span className="font-medium text-foreground">1 hour</span> to
              reduce API calls, and does not update after market hours.
            </p>
          </section>

          {/* Metrics */}
          <section>
            <h3 className="font-semibold mb-2">Metrics Explained</h3>
            <ul className="text-muted-foreground space-y-1.5 list-disc pl-5">
              <li>
                <span className="font-medium text-foreground">Volume</span>:
                Number of contracts traded during the current session
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Open Interest
                </span>{' '}
                : Total number of outstanding (open) contracts
              </li>
              <li>
                <span className="font-medium text-foreground">Price</span>:
                Current option premium (mid-price)
              </li>
              <li>
                <span className="font-medium text-foreground">Spread</span>:
                Difference between bid and ask prices (wider = less liquid)
              </li>
              <li>
                <span className="font-medium text-foreground">Delta (Δ)</span>:
                Price change per $1 move in the underlying stock
              </li>
              <li>
                <span className="font-medium text-foreground">Gamma (Γ)</span>:
                Rate of change of delta; highest when at-the-money
              </li>
              <li>
                <span className="font-medium text-foreground">Theta (Θ)</span>:
                Daily time decay; how much value lost each day
              </li>
              <li>
                <span className="font-medium text-foreground">Vega (ν)</span>:
                Sensitivity to implied volatility changes
              </li>
              <li>
                <span className="font-medium text-foreground">Rho (ρ)</span>:
                Sensitivity to interest rate changes
              </li>
              <li>
                <span className="font-medium text-foreground">Phi (φ)</span>:
                Sensitivity to dividend yield changes
              </li>
            </ul>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
