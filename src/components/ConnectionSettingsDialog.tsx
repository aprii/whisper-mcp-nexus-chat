import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings } from 'lucide-react';

interface ConnectionSettings {
  serverUrl: string;
}

interface ConnectionSettingsDialogProps {
  settings: ConnectionSettings;
  onSettingsChange: (settings: ConnectionSettings) => void;
  isConnected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
}

export const ConnectionSettingsDialog: React.FC<ConnectionSettingsDialogProps> = ({
  settings,
  onSettingsChange,
  isConnected,
  onConnect,
  onDisconnect,
  connectionStatus
}) => {
  const [open, setOpen] = useState(false);
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSave = () => {
    onSettingsChange(localSettings);
    setOpen(false);
  };

  const handleCancel = () => {
    setLocalSettings(settings);
    setOpen(false);
  };

  const handleConnect = () => {
    onSettingsChange(localSettings);
    onConnect();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-slate-300 hover:text-white hover:bg-slate-700"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Connection Settings</DialogTitle>
          <DialogDescription>
            Configure your MCP server connection settings.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="server-url" className="text-right">
              Server URL
            </Label>
            <Input
              id="server-url"
              value={localSettings.serverUrl}
              onChange={(e) => 
                setLocalSettings({ ...localSettings, serverUrl: e.target.value })
              }
              className="col-span-3"
              placeholder="http://localhost:3001/sse"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Status</Label>
            <div className="col-span-3">
              <span className={`text-sm ${
                connectionStatus === 'connected' ? 'text-green-500' :
                connectionStatus === 'connecting' ? 'text-yellow-500' :
                connectionStatus === 'error' ? 'text-red-500' : 'text-gray-500'
              }`}>
                {connectionStatus === 'connected' ? 'Connected' :
                 connectionStatus === 'connecting' ? 'Connecting...' :
                 connectionStatus === 'error' ? 'Connection Error' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <div className="flex gap-2 w-full">
            {isConnected ? (
              <Button
                onClick={onDisconnect}
                variant="outline"
                className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
              >
                Disconnect
              </Button>
            ) : (
              <Button
                onClick={handleConnect}
                variant="outline"
                className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
                disabled={connectionStatus === 'connecting' || !localSettings.serverUrl.trim()}
              >
                {connectionStatus === 'connecting' ? 'Connecting...' : 'Connect'}
              </Button>
            )}
            <Button onClick={handleCancel} variant="outline">
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Settings</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};