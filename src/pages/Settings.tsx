import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import settingsHero from "@/assets/settings-hero.png";

const Settings = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container py-8 max-w-4xl">
        <div className="mb-section">
          <img 
            src={settingsHero} 
            alt="Settings" 
            className="w-full h-32 object-cover rounded-lg mb-6"
          />
          <h1 className="font-display font-bold text-3xl mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account preferences and connected data sources.
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="Enter your name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" placeholder="your@email.com" />
              </div>
              <Button>Save Changes</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Connected Data Sources</CardTitle>
              <CardDescription>Manage your integrated platforms</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: "QuickBooks", status: "Connected" },
                { name: "ShipHero", status: "Connected" },
                { name: "Shopify", status: "Connected" },
                { name: "American Express", status: "Connected" },
                { name: "Mercury Bank", status: "Connected" },
                { name: "Google Sheets", status: "Connected" }
              ].map((source, index) => (
                <div key={source.name}>
                  {index > 0 && <Separator className="my-4" />}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{source.name}</p>
                      <p className="text-sm text-muted-foreground">{source.status}</p>
                    </div>
                    <Button variant="outline" size="sm">Disconnect</Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>Customize your experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input id="timezone" placeholder="UTC-8" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Default Currency</Label>
                <Input id="currency" placeholder="USD" />
              </div>
              <Button>Update Preferences</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Settings;
