const express = require("express")
const QueueRouter = express.Router()

const queueController = require("../controllers/queue.controller")
const authMiddleware = require("../middleware.js/auth.middleware")
const roleMiddleware = require("../middleware.js/role.middleware")

// LIVE QUEUE
QueueRouter.get(
    "/live",
    authMiddleware,
    roleMiddleware("doctor"),
    queueController.getLiveQueue
)

// CURRENT PATIENT
QueueRouter.get(
    "/current",
    authMiddleware,
    roleMiddleware("doctor"),
    queueController.getCurrentPatient
)

// CALL NEXT PATIENT
QueueRouter.put(
    "/next",
    authMiddleware,
    roleMiddleware("doctor"),
    queueController.callNextPatient
)

// QUEUE POSITION (patient side)
QueueRouter.get(
    "/position/:id",
    authMiddleware,
    roleMiddleware("patient"),
    queueController.getQueuePosition
)

QueueRouter.post("/admin/add-to-queue",
  authMiddleware,
  roleMiddleware("admin"),
 queueController.addToQueue
);

module.exports = QueueRouter
