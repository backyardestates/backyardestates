'use client'
import styles from './OpenHouseGallery.module.css';
import Image from 'next/image';
import { useState } from 'react';
import GalleryModal from '../GalleryModal';

export function OpenHouseGallery({ images, flyer }) {
    const [showGalleryModal, setShowGalleryModal] = useState(false);
    const [index, setIndex] = useState(0);

    const closeModal = () => {
        setShowGalleryModal(false);
        setIndex(0);
    }

    return (
        <>
            <div className={styles.featureImageContainer}>
                {flyer.openHouseFlyers ? (
                    <Image
                        src={flyer.openHouseFlyers[0].url}
                        alt={`ADU Open House Flyer for ${flyer.name}`}
                        width={500}
                        height={600}
                        className={styles.featureImage}
                        quality={100}
                        onClick={() => setShowGalleryModal(true)}
                        sizes='80vw'
                    />
                ) : (
                    <Image
                        src={images[0].url}
                        alt={`ADU Open House Flyer for ${flyer.name}`}
                        width={500}
                        height={600}
                        className={styles.featureImage}
                        quality={100}
                        onClick={() => setShowGalleryModal(true)}
                        sizes='80vw'
                    />
                )}
            </div>
            {
                showGalleryModal && (
                    <GalleryModal
                        items={images}
                        index={index}
                        setIndex={setIndex}
                        onClose={closeModal}
                    />
                )
            }
        </>
    )
}