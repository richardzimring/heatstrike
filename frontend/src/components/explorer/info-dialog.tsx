import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface InfoDialogProps {
  className?: string;
}

export function InfoDialog({ className }: InfoDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn('h-8 gap-1.5 text-muted-foreground', className)}
        >
          <Info className="size-3.5" />
          <span className="hidden sm:inline">About</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[60vh] overflow-y-auto">
        <div className="space-y-5 text-sm">
          <section>
            <h3 className="font-semibold mb-2">How It Works</h3>
            <p className="text-muted-foreground">
              The heatmap displays strike prices on the Y-axis and expiration
              dates on the X-axis. Color intensity represents the selected
              metric, making it easy to spot areas of high activity or unusual
              pricing at a glance.
            </p>
          </section>

          <section>
            <h3 className="font-semibold mb-2">Controls</h3>
            <ul className="text-muted-foreground space-y-1.5 list-disc pl-5">
              <li>
                <span className="font-medium text-foreground">
                  Calls / Puts
                </span>{' '}
                — toggle between call and put option chains
              </li>
              <li>
                <span className="font-medium text-foreground">Color</span> —
                choose the metric that drives cell color intensity
              </li>
              <li>
                <span className="font-medium text-foreground">Size</span> —
                optionally scale cell size by a second metric for
                two-dimensional comparison
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Strike range
                </span>{' '}
                — how many strikes above and below the current price to show
              </li>
              <li>
                <span className="font-medium text-foreground">Expirations</span>{' '}
                — how many upcoming expiration dates to include
              </li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold mb-2">Caching</h3>
            <p className="text-muted-foreground">
              Options data is cached for{' '}
              <span className="font-medium text-foreground">1 hour</span> to
              reduce API load. Data does not update after market hours.
            </p>
          </section>

          <section>
            <h3 className="font-semibold mb-2">Metrics Explained</h3>
            <ul className="text-muted-foreground space-y-1.5 list-disc pl-5">
              <li>
                <span className="font-medium text-foreground">Volume</span> —
                contracts traded during the current session
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Open Interest
                </span>{' '}
                — total outstanding (open) contracts
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Unusual Activity
                </span>{' '}
                — volume / open interest ratio; high values suggest new
                positioning
              </li>
              <li>
                <span className="font-medium text-foreground">Price</span> —
                option premium (mid-price between bid and ask)
              </li>
              <li>
                <span className="font-medium text-foreground">Spread</span> —
                bid-ask spread; wider = less liquid
              </li>
              <li>
                <span className="font-medium text-foreground">IV</span> —
                implied volatility; the market's expectation of future price
                movement
              </li>
              <li>
                <span className="font-medium text-foreground">Delta (Δ)</span> —
                price change per $1 move in the underlying
              </li>
              <li>
                <span className="font-medium text-foreground">Gamma (Γ)</span> —
                rate of change of delta; highest near the money
              </li>
              <li>
                <span className="font-medium text-foreground">Theta (Θ)</span> —
                daily time decay; value lost each day
              </li>
              <li>
                <span className="font-medium text-foreground">Vega (ν)</span> —
                sensitivity to implied volatility changes
              </li>
              <li>
                <span className="font-medium text-foreground">Rho (ρ)</span> —
                sensitivity to interest rate changes
              </li>
              <li>
                <span className="font-medium text-foreground">Phi (φ)</span> —
                sensitivity to dividend yield changes
              </li>
            </ul>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
