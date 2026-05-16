export const getChatNotificationBody = (message) => {
  if (!message) {
    return "You have a new message.";
  }

  const text = String(message.message || "").trim();

  if (text) {
    return text.length > 120 ? `${text.slice(0, 117)}...` : text;
  }

  if (message.attachment?.originalName) {
    return `Sent an attachment: ${message.attachment.originalName}`;
  }

  return "You have a new message.";
};

export const notifyDesktopMessage = async ({
  title,
  body,
  tag,
}) => {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }

  let permission = Notification.permission;

  if (permission === "default") {
    try {
      permission = await Notification.requestPermission();
    } catch (error) {
      return false;
    }
  }

  if (permission !== "granted") {
    return false;
  }

  const notification = new Notification(title || "New message", {
    body: body || "You have a new message.",
    tag: tag || undefined,
  });

  notification.onclick = () => {
    window.focus();
    notification.close();
  };

  return true;
};