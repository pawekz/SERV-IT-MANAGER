import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#fff',
        paddingVertical: 30,
        paddingHorizontal: 40,
        fontFamily: 'Helvetica',
        fontSize: 11,
        color: '#222',
        lineHeight: 1.5,
    },
    header: {
        marginBottom: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
        borderBottomStyle: 'solid',
        paddingBottom: 12,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#111',
        letterSpacing: 1,
    },
    subtitle: {
        fontSize: 13,
        textAlign: 'center',
        color: '#444',
        marginTop: 4,
        fontWeight: 'medium',
        letterSpacing: 0.5,
    },
    ticketRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    ticketLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#333',
    },
    ticketValue: {
        fontSize: 14,
        backgroundColor: '#f0f0f0',
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 6,
        fontWeight: 'bold',
        color: '#111',
        letterSpacing: 0.5,
    },
    sectionBox: {
        marginBottom: 24,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#ddd',
        borderTopStyle: 'solid',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#111',
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        borderBottomStyle: 'solid',
        paddingBottom: 6,
        letterSpacing: 0.8,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    col: {
        flex: 1,
        paddingRight: 12,
    },
    label: {
        fontSize: 10,
        color: '#555',
        marginBottom: 4,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.7,
    },
    value: {
        fontSize: 12,
        color: '#111',
        fontWeight: 'normal',
    },
    textarea: {
        fontSize: 11,
        color: '#111',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
        padding: 8,
        minHeight: 48,
        textAlignVertical: 'top',
        backgroundColor: '#fafafa',
    },
    devicePhotoBox: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 6,
        padding: 8,
        alignItems: 'center',
        marginRight: 12,
        marginBottom: 12,
        width: 140,
        height: 180,
        justifyContent: 'space-between',
    },
    devicePhotoLabel: {
        fontSize: 11,
        color: '#333',
        marginBottom: 8,
        fontWeight: '600',
    },
    devicePhoto: {
        width: 120,
        height: 120,
        borderRadius: 6,
        objectFit: 'cover',
        marginBottom: 4,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    termsText: {
        fontSize: 10,
        color: '#444',
        lineHeight: 1.6,
        marginBottom: 8,
    },
    termsTitle: {
        fontWeight: 'bold',
        color: '#222',
        fontSize: 11,
        marginBottom: 4,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 24,
    },
    checkbox: {
        width: 14,
        height: 14,
        borderWidth: 1,
        borderColor: '#222',
        marginRight: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxTick: {
        fontSize: 12,
        color: '#222',
        textAlign: 'center',
        lineHeight: 12,
    },
    signatureContainer: {
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#222',
        borderRadius: 4,
        padding: 6,
        width: 140,
        height: 50,
    },
    signatureImage: {
        width: 130,
        height: 40,
        objectFit: 'contain',
    },
    signatureLabel: {
        fontSize: 10,
        color: '#222',
        marginTop: 6,
        textAlign: 'center',
    },
    photosWrapper: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
    },
    noPhotosText: {
        fontSize: 12,
        color: '#999',
        fontStyle: 'italic',
    },
});

const PdfDocument = ({ signatureDataURL, formData }) => (
    <Document>
        {/* Page 1: Personal & Device Info */}
        <Page size="A4" style={styles.page}>
            <View style={styles.header}>
                <Text style={styles.title}>IOCONNECT REPAIR SERVICE</Text>
                <Text style={styles.subtitle}>Repair Check-In Form</Text>
            </View>

            <View style={styles.ticketRow}>
                <Text style={styles.ticketLabel}>Customer Check-In</Text>
                <Text style={styles.ticketValue}>{formData.ticketNumber || 'N/A'}</Text>
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
                    <View style={styles.col}>
                        <Text style={styles.label}>Device Type</Text>
                        <Text style={styles.value}>{formData.deviceType || 'N/A'}</Text>
                    </View>
                    <View style={styles.col}>
                        <Text style={styles.label}>Brand</Text>
                        <Text style={styles.value}>{formData.deviceBrand || 'N/A'}</Text>
                    </View>
                    <View style={styles.col}>
                        <Text style={styles.label}>Model</Text>
                        <Text style={styles.value}>{formData.deviceModel || 'N/A'}</Text>
                    </View>
                </View>
                <View style={styles.row}>
                    <View style={styles.col}>
                        <Text style={styles.label}>Serial Number</Text>
                        <Text style={styles.value}>{formData.deviceSerialNumber || 'N/A'}</Text>
                    </View>
                    <View style={styles.col}>
                        <Text style={styles.label}>Color</Text>
                        <Text style={styles.value}>{formData.deviceColor || 'N/A'}</Text>
                    </View>
                    <View style={styles.col}>
                        <Text style={styles.label}>Password</Text>
                        <Text style={styles.value}>{formData.devicePassword || 'N/A'}</Text>
                    </View>
                </View>
            </View>

            {/* Accessories */}
            <View style={styles.sectionBox}>
                <Text style={styles.sectionTitle}>ACCESSORIES</Text>
                <Text style={styles.textarea}>{formData.accessories || 'None'}</Text>
            </View>

            {/* Problem Description */}
            <View style={styles.sectionBox}>
                <Text style={styles.sectionTitle}>PROBLEM DESCRIPTION</Text>
                <Text style={styles.textarea}>{formData.reportedIssue || 'No issues reported.'}</Text>
            </View>
        </Page>

        {/* Page 2: Photos */}
        <Page size="A4" style={styles.page}>
            <View style={styles.header}>
                <Text style={styles.title}>REPAIR PHOTOS</Text>
                <Text style={styles.subtitle}>Device Condition Documentation</Text>
            </View>
            {formData.repairPhotos && formData.repairPhotos.length > 0 ? (
                <View style={styles.photosWrapper}>
                    {formData.repairPhotos.slice(0, 3).map((src, idx) => (
                        <View key={idx} style={styles.devicePhotoBox}>
                            <Text style={styles.devicePhotoLabel}>Photo {idx + 1}</Text>
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
                    <View key={i} style={{ marginBottom: 8 }}>
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

export default PdfDocument;
