import nodemailer from 'nodemailer';
import { env } from '../config/env';

interface OrderEmailData {
    customerName: string;
    customerEmail: string;
    orderNumber: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    deliveryFee: number;
    discount: number;
    total: number;
    address: string;
    couponCode?: string;
}

class EmailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: env.smtpHost,
            port: env.smtpPort,
            secure: env.smtpPort === 465,
            auth: {
                user: env.smtpUser,
                pass: env.smtpPass,
            },
        });
    }

    private getOrderConfirmationTemplate(data: OrderEmailData): string {
        const formatPrice = (price: number) => `${price} DT`;
        
        return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmation de commande - WASSL</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header with Logo -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 40px 40px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 36px; font-weight: bold; letter-spacing: 2px;">
                                WASSL
                            </h1>
                            <p style="margin: 10px 0 0 0; color: #a0aec0; font-size: 14px;">
                                Connectez-vous intelligemment
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Success Icon -->
                    <tr>
                        <td style="padding: 40px 40px 20px 40px; text-align: center;">
                            <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
                                <span style="color: #ffffff; font-size: 40px;">✓</span>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 0 40px 30px 40px; text-align: center;">
                            <h2 style="margin: 0 0 10px 0; color: #1a1a2e; font-size: 28px; font-weight: bold;">
                                Merci pour votre commande !
                            </h2>
                            <p style="margin: 0; color: #64748b; font-size: 16px; line-height: 1.6;">
                                Bonjour <strong>${data.customerName}</strong>, votre commande a été reçue avec succès.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Order Number -->
                    <tr>
                        <td style="padding: 0 40px 30px 40px;">
                            <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 12px; padding: 20px; text-align: center; border: 1px solid #e2e8f0;">
                                <p style="margin: 0 0 5px 0; color: #64748b; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                                    Numéro de commande
                                </p>
                                <p style="margin: 0; color: #1a1a2e; font-size: 24px; font-weight: bold; letter-spacing: 2px;">
                                    ${data.orderNumber}
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Order Details -->
                    <tr>
                        <td style="padding: 0 40px 30px 40px;">
                            <h3 style="margin: 0 0 20px 0; color: #1a1a2e; font-size: 18px; font-weight: 600; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
                                📦 Détails de la commande
                            </h3>
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="padding: 15px; background-color: #f8fafc; border-radius: 8px;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="color: #1a1a2e; font-weight: 600; font-size: 16px;">
                                                    ${data.productName}
                                                </td>
                                                <td align="right" style="color: #64748b; font-size: 14px;">
                                                    x${data.quantity}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td colspan="2" style="padding-top: 5px; color: #64748b; font-size: 14px;">
                                                    Prix unitaire: ${formatPrice(data.unitPrice)}
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Pricing Summary -->
                    <tr>
                        <td style="padding: 0 40px 30px 40px;">
                            <table width="100%" cellpadding="0" cellspacing="0" style="border-top: 1px solid #e2e8f0; padding-top: 20px;">
                                <tr>
                                    <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Sous-total</td>
                                    <td align="right" style="padding: 8px 0; color: #1a1a2e; font-size: 14px;">${formatPrice(data.subtotal)}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Frais de livraison</td>
                                    <td align="right" style="padding: 8px 0; color: #1a1a2e; font-size: 14px;">${formatPrice(data.deliveryFee)}</td>
                                </tr>
                                ${data.discount > 0 ? `
                                <tr>
                                    <td style="padding: 8px 0; color: #10b981; font-size: 14px;">
                                        Réduction ${data.couponCode ? `(${data.couponCode})` : ''}
                                    </td>
                                    <td align="right" style="padding: 8px 0; color: #10b981; font-size: 14px;">-${formatPrice(data.discount)}</td>
                                </tr>
                                ` : ''}
                                <tr>
                                    <td style="padding: 15px 0 0 0; color: #1a1a2e; font-size: 18px; font-weight: bold; border-top: 2px solid #1a1a2e;">
                                        Total
                                    </td>
                                    <td align="right" style="padding: 15px 0 0 0; color: #1a1a2e; font-size: 24px; font-weight: bold; border-top: 2px solid #1a1a2e;">
                                        ${formatPrice(data.total)}
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Delivery Address -->
                    <tr>
                        <td style="padding: 0 40px 30px 40px;">
                            <h3 style="margin: 0 0 15px 0; color: #1a1a2e; font-size: 18px; font-weight: 600;">
                                📍 Adresse de livraison
                            </h3>
                            <div style="background-color: #f8fafc; border-radius: 8px; padding: 15px; border-left: 4px solid #1a1a2e;">
                                <p style="margin: 0; color: #1a1a2e; font-size: 14px; line-height: 1.6;">
                                    ${data.address}
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Next Steps -->
                    <tr>
                        <td style="padding: 0 40px 30px 40px;">
                            <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-radius: 12px; padding: 25px; border: 1px solid #bfdbfe;">
                                <h3 style="margin: 0 0 15px 0; color: #1e40af; font-size: 16px; font-weight: 600;">
                                    🚀 Prochaines étapes
                                </h3>
                                <ul style="margin: 0; padding-left: 20px; color: #1e40af; font-size: 14px; line-height: 1.8;">
                                    <li>Nous préparons votre commande avec soin</li>
                                    <li>Vous recevrez un SMS lors de l'expédition</li>
                                    <li>Livraison sous 2-4 jours ouvrables</li>
                                    <li>Paiement à la livraison</li>
                                </ul>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Contact -->
                    <tr>
                        <td style="padding: 0 40px 40px 40px; text-align: center;">
                            <p style="margin: 0 0 15px 0; color: #64748b; font-size: 14px;">
                                Des questions ? Contactez-nous
                            </p>
                            <a href="mailto:contact@wassl.tn" style="display: inline-block; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                                Nous contacter
                            </a>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8fafc; padding: 30px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
                            <p style="margin: 0 0 10px 0; color: #1a1a2e; font-size: 18px; font-weight: bold;">
                                WASSL
                            </p>
                            <p style="margin: 0 0 15px 0; color: #64748b; font-size: 12px;">
                                Cartes NFC & Plaques Google Review
                            </p>
                            <p style="margin: 0; color: #94a3b8; font-size: 11px;">
                                © ${new Date().getFullYear()} WASSL. Tous droits réservés.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `;
    }

    async sendOrderConfirmation(data: OrderEmailData): Promise<boolean> {
        if (!env.smtpUser || !env.smtpPass) {
            console.warn('Email not configured - skipping order confirmation email');
            return false;
        }

        try {
            const mailOptions = {
                from: env.smtpFrom,
                to: data.customerEmail,
                subject: `✅ Confirmation de commande ${data.orderNumber} - WASSL`,
                html: this.getOrderConfirmationTemplate(data),
            };

            await this.transporter.sendMail(mailOptions);
            console.log(`Order confirmation email sent to ${data.customerEmail}`);
            return true;
        } catch (error) {
            console.error('Failed to send order confirmation email:', error);
            return false;
        }
    }

    async verifyConnection(): Promise<boolean> {
        try {
            await this.transporter.verify();
            console.log('Email service connected successfully');
            return true;
        } catch (error) {
            console.error('Email service connection failed:', error);
            return false;
        }
    }
}

export const emailService = new EmailService();
