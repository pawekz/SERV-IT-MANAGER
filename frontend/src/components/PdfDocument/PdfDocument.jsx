import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#fff',
        paddingVertical: 36,
        paddingHorizontal: 48,
        fontFamily: 'Helvetica',
        fontSize: 11,
        color: '#111',
        lineHeight: 1.5,
    },
    header: {
        marginBottom: 18,
        borderBottomWidth: 2,
        borderBottomColor: '#000',
        borderBottomStyle: 'solid',
        paddingBottom: 10,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#000',
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 12,
        textAlign: 'center',
        color: '#222',
        marginTop: 2,
        fontWeight: 'normal',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    ticketRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 18,
    },
    ticketLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#000',
        letterSpacing: 0.5,
    },
    ticketValue: {
        fontSize: 14,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#000',
        paddingVertical: 5,
        paddingHorizontal: 12,
        fontWeight: 'bold',
        letterSpacing: 0.5,
        color: '#000',
    },
    sectionBox: {
        marginBottom: 12,
        paddingTop: 6,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        borderBottomStyle: 'solid',
        paddingBottom: 4,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    col: {
        flex: 1,
        paddingRight: 10,
    },
    label: {
        fontSize: 9,
        color: '#222',
        marginBottom: 2,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 0.7,
    },
    value: {
        fontSize: 11,
        color: '#000',
        fontWeight: 'normal',
    },
    textarea: {
        fontSize: 10,
        color: '#000',
        padding: 6,
        minHeight: 36,
        textAlignVertical: 'top',
    },
    devicePhotoBox: {
        borderWidth: 1,
        borderColor: '#000',
        padding: 6,
        alignItems: 'center',
        marginRight: 10,
        marginBottom: 10,
        width: 120,
        height: 150,
        justifyContent: 'space-between',
        backgroundColor: '#fff',
    },
    devicePhotoLabel: {
        fontSize: 10,
        color: '#000',
        marginBottom: 6,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    devicePhoto: {
        width: 100,
        height: 100,
        objectFit: 'cover',
        marginBottom: 2,
        borderWidth: 1,
        borderColor: '#000',
    },
    termsHeaderLine: {
        width: '100%',
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        borderBottomStyle: 'solid',
        marginBottom: 12,
    },
    termsText: {
        fontSize: 9,
        color: '#111',
        lineHeight: 1.5,
        marginBottom: 6,
    },
    termsTitle: {
        fontWeight: 'bold',
        color: '#000',
        fontSize: 10,
        marginBottom: 2,
        textTransform: 'uppercase',
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 18,
    },
    checkbox: {
        width: 12,
        height: 12,
        borderWidth: 1,
        borderColor: '#000',
        backgroundColor: '#000',
        marginRight: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxTick: {
        fontSize: 10,
        color: '#000',
        textAlign: 'center',
        lineHeight: 10,
    },
    signatureContainer: {
        alignItems: 'center',
        padding: 6,
        width: 180,
        height: 60,
        backgroundColor: '#fff',
    },
    signatureImage: {
        width: 160,
        height: 40,
        objectFit: 'contain',
        marginBottom: -10,
        zIndex: 1,
    },
    signatureLine: {
        width: 160,
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        borderBottomStyle: 'solid',
        marginBottom: 2,
        zIndex: 0,
    },
    signatureLabel: {
        fontSize: 9,
        color: '#000',
        marginTop: 2,
        textAlign: 'center',
    },
    photosWrapper: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
    },
    noPhotosText: {
        fontSize: 11,
        color: '#888',
        fontStyle: 'italic',
    },
});

const PdfDocument = ({ signatureDataURL, formData, kind }) => {
    console.log('Rendering PDF Document with kind:', formData);
    return(
        <Document>
            {/* Page 1: Personal & Device Info */}
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <Text style={styles.title}>IOCONNECT {kind} SERVICE</Text>
                    <Text style={styles.subtitle}>{kind} Check-In Form</Text>
                </View>

                <View style={styles.ticketRow}>
                    <Text style={styles.ticketLabel}>Customer Check-In</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ fontSize: 12, color: '#000', marginRight: 4, fontWeight: 'normal' }}>Ticket #:</Text>
                        {kind === 'repair' && (
                            <Text style={{ fontSize: 14, color: '#000', fontWeight: 'bold' }}>
                                {formData.ticketNumber || 'N/A'}
                            </Text>
                        )}
                        {kind === 'warranty' && (
                            <Text style={{ fontSize: 14, color: '#000', fontWeight: 'bold' }}>
                                {formData.warrantyNumber || 'N/A'}
                            </Text>
                        )}
                    </View>
                </View>

                {/* Customer Information */}
                <View style={styles.sectionBox}>
                    <Text style={styles.sectionTitle}>CUSTOMER INFORMATION</Text>
                    <View style={styles.row}>
                        <View style={styles.col}>
                            <Text style={styles.label}>Full Name</Text>
                            <Text style={styles.value}>{formData.customerName || 'N/A'}</Text>
                        </View>
                        <View style={styles.col}>
                            <Text style={styles.label}>Email</Text>
                            <Text style={styles.value}>{formData.customerEmail || 'N/A'}</Text>
                        </View>
                        <View style={styles.col}>
                            <Text style={styles.label}>Phone</Text>
                            <Text style={styles.value}>{formData.customerPhoneNumber || 'N/A'}</Text>
                        </View>
                    </View>
                </View>

                {/* Device Information */}
                <View style={styles.sectionBox}>
                    <Text style={styles.sectionTitle}>DEVICE INFORMATION</Text>
                    <View style={styles.row}>
                        { kind === 'warranty' && (
                            <View style={styles.col}>
                                <Text style={styles.label}>Device Name</Text>
                                <Text style={styles.value}>{formData.deviceName || 'N/A'}</Text>
                            </View>
                        )}
                        <View style={styles.col}>
                            <Text style={styles.label}>Device Type</Text>
                            <Text style={styles.value}>{formData.deviceType || 'N/A'}</Text>
                        </View>
                        { kind === 'repair' && (
                            <View style={styles.col}>
                                <Text style={styles.label}>Brand</Text>
                                <Text style={styles.value}>{formData.deviceBrand || 'N/A'}</Text>
                            </View>
                        )}
                        { kind === 'repair' && (
                            <View style={styles.col}>
                                <Text style={styles.label}>Model</Text>
                                <Text style={styles.value}>{formData.deviceModel || 'N/A'}</Text>
                            </View>
                        )}
                    </View>
                    <View style={styles.row}>
                        <View style={styles.col}>
                            <Text style={styles.label}>Serial Number</Text>
                            <Text style={styles.value}>{formData.deviceSerialNumber || formData.serialNumber ||  'N/A'}</Text>
                        </View>
                        { kind === 'repair' && (
                            <View style={styles.col}>
                                <Text style={styles.label}>Color</Text>
                                <Text style={styles.value}>{formData.deviceColor || 'N/A'}</Text>
                            </View>
                        )}
                        { kind === 'repair' && (
                            <View style={styles.col}>
                                <Text style={styles.label}>Password</Text>
                                <Text style={styles.value}>{formData.devicePassword || 'N/A'}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Accessories */}
                { kind === 'repair' && (
                    <View style={styles.sectionBox}>
                        <Text style={styles.sectionTitle}>ACCESSORIES</Text>
                        <Text style={styles.textarea}>{formData.accessories || 'None'}</Text>
                    </View>
                )}

                {/* Problem Description */}
                <View style={styles.sectionBox}>
                    <Text style={styles.sectionTitle}>PROBLEM DESCRIPTION</Text>
                    <Text style={styles.textarea}>{formData.reportedIssue || 'No issues reported.'}</Text>
                </View>

                { kind === 'warranty' && (
                    <View style={styles.sectionBox}>
                        <Text style={styles.sectionTitle}>RETURN REASON</Text>
                        <Text style={styles.textarea}>{formData.returnReason}</Text>
                    </View>
                )}
            </Page>

            {/* Page 2: Photos */}
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    { kind === 'repair' && (
                    <Text style={styles.title}>REPAIR PHOTOS</Text>
                        )}
                    { kind === 'warranty' && (
                        <Text style={styles.title}>WARRANTY PHOTOS</Text>
                    )}
                    <Text style={styles.subtitle}>Device Condition Documentation</Text>
                </View>
                {formData.repairPhotos && formData.repairPhotos.length > 0 ? (
                    <View style={styles.photosWrapper}>
                        {formData.repairPhotos.slice(0, 3).map((src, idx) => (
                            <View key={idx} style={styles.devicePhotoBox}>
                                <Text style={styles.devicePhotoLabel}>Repair Photo {idx + 1}</Text>
                                <Image src={src} style={styles.devicePhoto} />
                            </View>
                        ))}
                    </View>
                ) : formData.warrantyPhotosUrls && formData.warrantyPhotosUrls.length > 0 ? (
                    <View style={styles.photosWrapper}>
                        {formData.warrantyPhotosUrls.slice(0, 3).map((src, idx) => (
                            <View key={idx} style={styles.devicePhotoBox}>
                                <Text style={styles.devicePhotoLabel}>Warranty Photo {idx + 1}</Text>
                                <Image src={src} style={styles.devicePhoto} />
                            </View>
                        ))}
                    </View>
                ) : (
                    <Text style={styles.noPhotosText}>No device photos provided.</Text>
                )}
            </Page>

            {/* Page 3: Terms and Signature */}
            <Page size="A4" style={styles.page}>
                <View style={[styles.header, { borderBottomWidth: 0, marginBottom: 16 }]}>
                    <Text style={styles.title}>TERMS AND CONDITIONS</Text>
                </View>
                <View style={styles.termsHeaderLine} />
                <View>
                    {[
                        {
                            title: 'Acceptance of Terms',
                            body:
                                'By using IOCONNECT, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this platform. Your continued use of IOCONNECT Manager constitutes your acceptance of any updates or modifications to these Terms of Service.',
                        },
                        {
                            title: 'Service Description',
                            body:
                                'IOCONNECT Manager provides a platform for IT service providers to manage repair services, track repair status, communicate with customers, and improve overall service efficiency. This includes automated repair tracking, enhanced customer communication tools, workflow optimization features, and reporting tools to monitor performance.',
                        },
                        {
                            title: 'Customer Responsibilities',
                            body:
                                'Customers must provide accurate device information, back up data prior to repair, remove unnecessary accessories, and disable security features that may hinder service.',
                        },
                        {
                            title: 'Data Privacy and Security',
                            body:
                                'We take your privacy seriously. Our use of your data is governed by our Privacy Policy. While we implement industry-standard security practices, no method is 100% secure. You agree that IOCONNECT may collect and use your information as outlined in the Privacy Policy.',
                        },
                        {
                            title: 'Subscription and Billing',
                            body:
                                'Subscription plans are billed in advance on a recurring basis. You may cancel at any time, but no refunds will be issued for the current billing cycle. Access will remain active until the end of the paid period.',
                        },
                        {
                            title: 'Warranty',
                            body:
                                'Repairs are covered by a 90-day warranty for parts and labor specific to the original repair. This does not cover damages from misuse, accidents, or issues unrelated to the original service.',
                        },
                        {
                            title: 'Limitation of Liability',
                            body:
                                'IOCONNECT is not liable for any data loss during repair. Customers are responsible for data backup. Our liability is limited to the amount paid for the repair service.',
                        },
                        {
                            title: 'Contact Us',
                            body:
                                'If you have any questions, please contact us at info@ioconnect-cbu.com or call 032-272-9019.',
                        },
                    ].map((item, i) => (
                        <View key={i} style={{ marginBottom: 4 }}>
                            <Text style={styles.termsTitle}>
                                {i + 1}. {item.title}
                            </Text>
                            <Text style={styles.termsText}>{item.body}</Text>
                        </View>
                    ))}

                    {/* Agreement checkbox and Signature */}
                    <View style={styles.checkboxRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                            <View style={styles.checkbox}>
                                <Text style={styles.checkboxTick}>✓</Text>
                            </View>
                            <Text style={{ fontSize: 11, color: '#333' }}>I have read and agree to the terms and conditions.</Text>
                        </View>

                        {/* Signature */}
                        <View style={styles.signatureContainer}>
                            {typeof signatureDataURL === 'string' && signatureDataURL.startsWith('data:image') ? (
                                <>
                                    <Image src={signatureDataURL} style={styles.signatureImage} />
                                    <View style={styles.signatureLine} />
                                    <Text style={styles.signatureLabel}>Customer Signature</Text>
                                </>
                            ) : (
                                <Text style={{ fontSize: 11, color: '#999', textAlign: 'center' }}>No signature captured.</Text>
                            )}
                        </View>
                    </View>
                </View>
            </Page>
        </Document>
    );
}

export default PdfDocument;
