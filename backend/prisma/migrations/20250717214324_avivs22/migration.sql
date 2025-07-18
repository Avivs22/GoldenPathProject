-- CreateTable
CREATE TABLE "PlanesDB" (
    "planesID" TEXT NOT NULL,
    "planelongitude" DOUBLE PRECISION NOT NULL,
    "planelatitude" DOUBLE PRECISION NOT NULL,
    "planevelocity" DOUBLE PRECISION NOT NULL,
    "planeheading" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "PlanesDB_pkey" PRIMARY KEY ("planesID")
);

-- CreateTable
CREATE TABLE "DroneDB" (
    "droneID" SERIAL NOT NULL,
    "dronelatitude" DOUBLE PRECISION NOT NULL,
    "dronelongitude" DOUBLE PRECISION NOT NULL,
    "droneradius" INTEGER NOT NULL,
    "dronespeed" INTEGER NOT NULL,

    CONSTRAINT "DroneDB_pkey" PRIMARY KEY ("droneID")
);
