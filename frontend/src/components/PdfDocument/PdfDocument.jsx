import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: { flexDirection: 'column', backgroundColor: '#FFFFFF', padding: 24 },
    header: { flexDirection: 'row', alignItems: 'center', borderBottom: '2 solid #e5e7eb', paddingBottom: 12, marginBottom: 16 },
    headerText: { flexDirection: 'column', flexGrow: 1 },
    title: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', color: '#22223b' },
    subtitle: { fontSize: 12, color: '#6b7280', textAlign: 'center', marginTop: 2 },
    sectionBox: { border: '1 solid #e5e7eb', borderRadius: 6, marginBottom: 16, padding: 12, backgroundColor: '#fafafa' },
    sectionTitleBar: { backgroundColor: '#f3f4f6', borderLeft: '4 solid #33e407', padding: 6, marginBottom: 8 },
    sectionTitle: { fontWeight: 'bold', color: '#22223b', fontSize: 12 },
    label: { fontSize: 10, color: '#374151', marginBottom: 2 },
    value: { fontSize: 11, color: '#22223b', marginBottom: 6, padding: 4, backgroundColor: '#fff', border: '1 solid #e5e7eb', borderRadius: 4 },
    row: { flexDirection: 'row', gap: 12, marginBottom: 8 },
    col: { flex: 1 },
    textarea: { fontSize: 11, color: '#22223b', backgroundColor: '#fff', border: '1 solid #e5e7eb', borderRadius: 4, padding: 4, minHeight: 32, marginBottom: 6 },
    ticketRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    ticketLabel: { fontSize: 10, color: '#374151', fontWeight: 'bold', marginRight: 4 },
    ticketValue: { fontSize: 12, color: '#22223b', backgroundColor: '#f3f4f6', borderRadius: 4, padding: 4, minWidth: 60, textAlign: 'center', fontWeight: 'bold' },
    devicePhotoBox: { border: '2 dashed #d1d5db', borderRadius: 8, padding: 12, alignItems: 'center', marginBottom: 8, backgroundColor: '#fff', marginRight: 8 },
    devicePhoto: { width: 120, height: 120, marginBottom: 8 },
    devicePhotoLabel: { fontSize: 10, color: '#6b7280', marginBottom: 2 },
    checkboxRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    checkbox: { width: 12, height: 12, border: '1 solid #33e407', marginRight: 6 },
    termsText: { fontSize: 10, color: '#6b7280' },
    signatureRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
    termsTextContainer: { flexDirection: 'row', alignItems: 'center', flexGrow: 1 },
});

const PdfDocument = ({ signatureDataURL, formData }) => (
    <Document>
        {/* Page 1: Personal & Device Info */}
        <Page size="A4" style={styles.page}>
            <View style={styles.header}>
                <View style={styles.headerText}>
                    <Text style={styles.title}>IOCONNECT REPAIR SERVICE</Text>
                    <Text style={styles.subtitle}>Repair Check-In Form</Text>
                </View>
            </View>
            <View style={styles.ticketRow}>
                <Text style={styles.label}>Customer Check-In</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.ticketLabel}>Ticket #:</Text>
                    <Text style={styles.ticketValue}>{formData.ticketNumber}</Text>
                </View>
            </View>
            {/* Customer Information */}
            <View style={styles.sectionBox}>
                <View style={styles.sectionTitleBar}>
                    <Text style={styles.sectionTitle}>CUSTOMER INFORMATION</Text>
                </View>
                <View style={styles.row}>
                    <View style={styles.col}>
                        <Text style={styles.label}>Full Name:</Text>
                        <Text style={styles.value}>{formData.customerName}</Text>
                    </View>
                    <View style={styles.col}>
                        <Text style={styles.label}>Email:</Text>
                        <Text style={styles.value}>{formData.customerEmail}</Text>
                    </View>
                    <View style={styles.col}>
                        <Text style={styles.label}>Phone:</Text>
                        <Text style={styles.value}>{formData.customerPhoneNumber}</Text>
                    </View>
                </View>
            </View>
            {/* Device Information */}
            <View style={styles.sectionBox}>
                <View style={styles.sectionTitleBar}>
                    <Text style={styles.sectionTitle}>DEVICE INFORMATION</Text>
                </View>
                <View style={styles.row}>
                    <View style={styles.col}>
                        <Text style={styles.label}>Device Type:</Text>
                        <Text style={styles.value}>{formData.deviceType}</Text>
                    </View>
                    <View style={styles.col}>
                        <Text style={styles.label}>Brand:</Text>
                        <Text style={styles.value}>{formData.deviceBrand}</Text>
                    </View>
                    <View style={styles.col}>
                        <Text style={styles.label}>Model:</Text>
                        <Text style={styles.value}>{formData.deviceModel}</Text>
                    </View>
                </View>
                <View style={styles.row}>
                    <View style={styles.col}>
                        <Text style={styles.label}>Serial Number:</Text>
                        <Text style={styles.value}>{formData.deviceSerialNumber}</Text>
                    </View>
                    <View style={styles.col}>
                        <Text style={styles.label}>Color:</Text>
                        <Text style={styles.value}>{formData.deviceColor}</Text>
                    </View>
                    <View style={styles.col}>
                        <Text style={styles.label}>Password:</Text>
                        <Text style={styles.value}>{formData.devicePassword}</Text>
                    </View>
                </View>
            </View>
            {/* Accessories */}
            <View style={styles.sectionBox}>
                <View style={styles.sectionTitleBar}>
                    <Text style={styles.sectionTitle}>ACCESSORIES</Text>
                </View>
                <Text style={styles.label}>Customer Owned Accessories:</Text>
                <Text style={styles.textarea}>{formData.accessories}</Text>
            </View>
            {/* Problem Description */}
            <View style={styles.sectionBox}>
                <View style={styles.sectionTitleBar}>
                    <Text style={styles.sectionTitle}>PROBLEM DESCRIPTION</Text>
                </View>
                <Text style={styles.label}>Customer Reported Issues:</Text>
                <Text style={styles.textarea}>{formData.reportedIssue}</Text>
            </View>
        </Page>

        {/* Page 2: Photos */}
        <Page size="A4" style={styles.page}>
            <View style={styles.header}>
                <View style={styles.headerText}>
                    <Text style={styles.title}>REPAIR PHOTOS</Text>
                    <Text style={styles.subtitle}>Device Condition Images</Text>
                </View>
            </View>
            {formData.repairPhotos && formData.repairPhotos.length > 0 ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                    {formData.repairPhotos.slice(0, 3).map((src, idx) => (
                        <View key={idx} style={styles.devicePhotoBox}>
                            <Text style={styles.devicePhotoLabel}>Photo {idx + 1}</Text>
                            <Image src={src} style={styles.devicePhoto} />
                        </View>
                    ))}
                </View>
            ) : (
                <Text style={styles.label}>No device photos provided.</Text>
            )}
        </Page>

        {/* Page 3: Terms and Signature */}
        <Page size="A4" style={styles.page}>
            <View style={styles.header}>
                <View style={styles.headerText}>
                    <Text style={styles.title}>TERMS AND CONDITIONS</Text>
                </View>
            </View>
            <View style={styles.sectionBox}>
                <View style={{ marginTop: 12 }}>
                    <Text style={styles.termsText}>
                        Welcome to IOCONNECT, an IT repair management system that automates repair tracking, enhances customer communication, and improves service efficiency for IT service providers. Please read these Terms of Service carefully before using our platform.
                    </Text>
                    <Text style={[styles.termsText, { marginTop: 10 }]}>
                        <Text style={{ fontWeight: 'bold' }}>1. Acceptance of Terms: </Text>
                        By using IOCONNECT, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this platform.
                    </Text>
                    <Text style={[styles.termsText, { marginTop: 8 }]}>
                        <Text style={{ fontWeight: 'bold' }}>2. Service Description: </Text>
                        IOCONNECT Manager provides a platform for IT service providers to manage repair services, track repair status, communicate with customers, and improve overall service efficiency.
                    </Text>
                    <Text style={[styles.termsText, { marginTop: 8 }]}>
                        <Text style={{ fontWeight: 'bold' }}>3. Customer Responsibilities: </Text>
                        Provide accurate information about the device and the issues requiring service. Back up all data before submitting devices for repair. Remove any accessories not required for the repair. Disable any security features that might prevent access to the device.
                    </Text>
                    <Text style={[styles.termsText, { marginTop: 8 }]}>
                        <Text style={{ fontWeight: 'bold' }}>4. Data Privacy and Security: </Text>
                        We take the privacy and security of your data seriously. Our collection, use, and processing of personal information is governed by our Privacy Policy, which is incorporated into these Terms of Service by reference.
                    </Text>
                    <Text style={[styles.termsText, { marginTop: 8 }]}>
                        <Text style={{ fontWeight: 'bold' }}>5. Subscription and Billing: </Text>
                        IOCONNECT Manager offers various subscription plans. By selecting a subscription plan, you agree to pay the subscription fees as described at the time of purchase. Subscription fees are billed in advance on a recurring basis based on your selected billing cycle.
                    </Text>
                    <Text style={[styles.termsText, { marginTop: 8 }]}>
                        <Text style={{ fontWeight: 'bold' }}>6. Warranty: </Text>
                        All repairs come with a 90-day warranty covering parts and labor for the specific repair performed. This warranty does not cover damage caused by accidents, misuse, or abuse after the repair, water or liquid damage, or issues unrelated to the original repair.
                    </Text>
                    <Text style={[styles.termsText, { marginTop: 8 }]}>
                        <Text style={{ fontWeight: 'bold' }}>7. Limitation of Liability: </Text>
                        IOCONNECT is not responsible for data loss during the repair process. We strongly recommend backing up all data before submitting devices for repair. Our maximum liability is limited to the cost of the repair service provided.
                    </Text>
                    <Text style={[styles.termsText, { marginTop: 8 }]}>
                        <Text style={{ fontWeight: 'bold' }}>8. Contact Us: </Text>
                        If you have any questions about these Terms, please contact us at info@ioconnect-cbu.com or 032-272-9019.
                    </Text>
                </View>
                <View style={{ marginTop: 12 }}>
                </View>
                <View style={styles.checkboxRow}>
                    <View style={styles.termsTextContainer}>
                        <View style={styles.checkbox}>
                            <Text style={{ fontSize: 10, textAlign: 'center', color: '#33e407' }}>✓</Text>
                        </View>
                        <Text style={styles.termsText}>
                            I have read and agree to the repair terms and conditions.
                        </Text>
                    </View>
                </View>
                <View style={styles.signatureRow}>
                    <View style={{ flex: 1 }} />
                    <View style={{
                        alignItems: 'flex-end',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        height: 80,
                        display: 'flex'
                    }}>
                        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                            {typeof signatureDataURL === 'string' && signatureDataURL.startsWith('data:image') ? (
                                <>
                                    <Image
                                        src={signatureDataURL}
                                        style={{ width: 120, height: 48, objectFit: 'contain', backgroundColor: '#fff', borderRadius: 4 }}
                                    />
                                    <Text style={{ fontSize: 10, color: '#374151', marginTop: 4, textAlign: 'center' }}>
                                        Customer Signature
                                    </Text>
                                </>
                            ) : (
                                <>
                                    <Text style={styles.label}>No signature captured.</Text>
                                    <Text style={{ fontSize: 10, color: '#374151', marginTop: 4, textAlign: 'center' }}>
                                        Customer Signature
                                    </Text>
                                </>
                            )}
                        </View>
                    </View>
                </View>
            </View>
        </Page>
    </Document>
);

export default PdfDocument;