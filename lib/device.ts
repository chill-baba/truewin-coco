'use client';

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
}

export function getClientDeviceInfo(): DeviceInfo {
  if (typeof window === 'undefined') {
    return { deviceId: 'dev_server', deviceName: 'Server Environment' };
  }

  // 1. Get or generate persistent unique device token
  let devId = localStorage.getItem('truwin_device_id');
  if (!devId) {
    devId = 'dev_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
    localStorage.setItem('truwin_device_id', devId);
  }

  // 2. Detect OS
  const ua = navigator.userAgent;
  let os = 'Unknown OS';
  if (/Macintosh|Mac OS X/i.test(ua)) os = 'macOS';
  else if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  // 3. Detect Browser
  let browser = 'Browser';
  if (/Edg/i.test(ua)) browser = 'Edge';
  else if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) browser = 'Chrome';
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';

  const deviceName = `${os} (${browser})`;
  return { deviceId: devId, deviceName };
}
